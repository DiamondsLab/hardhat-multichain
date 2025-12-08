import { ChildProcess, fork } from "child_process";
import { JsonRpcProvider } from "ethers"; // Use 'ethers' for v6
import { HardhatUserConfig } from "hardhat/types";
import { createLogger, format, Logger, transports } from "winston";
import { ChainConfig, ChainStatus, MultiChainProviders, ValidationResult } from "./type-extensions";

/**
 * Error thrown when chain configuration is invalid or missing
 */
export class ChainConfigError extends Error {
  constructor(chainName: string, issue: string) {
    super(`Chain '${chainName}' configuration error: ${issue}`);
    this.name = "ChainConfigError";
  }
}

/**
 * Error thrown when network connection fails
 */
export class NetworkConnectionError extends Error {
  public readonly originalError: Error;

  constructor(url: string, originalError: Error) {
    super(`Failed to connect to network at ${url}: ${originalError.message}`);
    this.name = "NetworkConnectionError";
    this.originalError = originalError;
  }
}

/**
 * Error thrown when process cleanup fails
 */
export class ProcessCleanupError extends Error {
  public readonly originalError: Error;

  constructor(chainName: string, originalError: Error) {
    super(`Failed to cleanup process for chain '${chainName}': ${originalError.message}`);
    this.name = "ProcessCleanupError";
    this.originalError = originalError;
  }
}

/**
 * ChainManager is responsible for managing multiple blockchain forks and their providers.
 * It handles the lifecycle of forked processes, network validation, and provider management.
 *
 * @example
 * ```typescript
 * // Setup multiple chains
 * const providers = await ChainManager.setupChains(['ethereum', 'polygon'], config);
 *
 * // Get a specific provider
 * const ethProvider = ChainManager.getProvider('ethereum');
 *
 * // Check chain status
 * const status = ChainManager.getChainStatus('ethereum');
 *
 * // Cleanup when done
 * await ChainManager.cleanup();
 * ```
 */
class ChainManager {
  private static instances: MultiChainProviders = new Map();
  private static processes: Map<string, ChildProcess> = new Map();
  private static chainStatuses: Map<string, ChainStatus> = new Map();
  private static forkPort = 8546;

  /**
   * Validates chain name format and constraints
   * @param chainName The chain name to validate
   * @returns ValidationResult with errors and warnings
   */
  private static validateChainName(chainName: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!chainName || chainName.trim().length === 0) {
      errors.push("Chain name cannot be empty");
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(chainName)) {
      errors.push("Chain name can only contain letters, numbers, underscores, and hyphens");
    }

    if (chainName.length > 50) {
      warnings.push("Chain name is quite long, consider using a shorter name");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates RPC URL format and protocol
   * @param url The RPC URL to validate
   * @returns ValidationResult with errors and warnings
   */
  private static validateRpcUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!url || url.trim().length === 0) {
      errors.push("RPC URL cannot be empty");
    }

    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:", "ws:", "wss:"].includes(parsedUrl.protocol)) {
        errors.push("RPC URL must use http, https, ws, or wss protocol");
      }
    } catch {
      errors.push("Invalid RPC URL format");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates if a port is available and in valid range
   * @param port The port number to validate
   * @returns ValidationResult with errors and warnings
   */
  private static validatePort(port: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (port < 1024 || port > 65535) {
      errors.push("Port must be between 1024 and 65535");
    }

    if (port < 8000) {
      warnings.push("Using a port below 8000 might conflict with system services");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Sets up multiple blockchain forks based on provided configuration
   * @param chains Array of chain names to fork
   * @param config Hardhat user configuration containing chain settings
   * @param logsDir Optional directory for storing fork logs
   * @returns Promise resolving to Map of chain names to JsonRpcProviders
   * @throws ChainConfigError when chain configuration is invalid
   * @throws NetworkConnectionError when network connection fails
   */
  static async setupChains(
    chains: string[],
    config: HardhatUserConfig,
    logsDir?: string
  ): Promise<MultiChainProviders> {
    if (this.instances.size > 0) return this.instances;

    // Validate input
    if (!chains || chains.length === 0) {
      return new Map<string, JsonRpcProvider>();
    }

    // Validate all chain names first
    for (const chainName of chains) {
      const validation = this.validateChainName(chainName);
      if (!validation.isValid) {
        throw new ChainConfigError(chainName, validation.errors.join(", "));
      }

      // Log warnings
      validation.warnings.forEach(warning =>
        console.warn(`⚠️ Warning for chain '${chainName}': ${warning}`)
      );
    }

    try {
      await Promise.all(
        chains.map(async (chainName, index) => {
          try {
            let logger: Logger | undefined;
            if (logsDir) {
              logger = this.createForkLogger(chainName, logsDir);
            }

            // Check for hardhat chain and start a local hardhat node if needed
            if (chainName === "hardhat") {
              const providerUrl = "http://127.0.0.1:8545";
              console.log(
                `🔗 Setting up ${chainName} provider as ${providerUrl} with Hardhat-Multichain`
              );

              // Check if hardhat network is already accessible, if not start a hardhat node
              let isNetworkReady = false;
              try {
                await this.waitForNetwork(providerUrl, 2000); // Short timeout to check if already running
                isNetworkReady = true;
                console.log(`✅ Hardhat node already running at ${providerUrl}`);
              } catch {
                console.log(`🛠️ Starting Hardhat node at ${providerUrl}...`);

                // Start a hardhat node process
                const child = fork(
                  "node_modules/hardhat/internal/cli/cli.js",
                  ["node", "--port", "8545", "--hostname", "127.0.0.1"],
                  {
                    env: {
                      ...process.env,
                      HH_CHAIN_ID: "31337",
                    },
                    stdio: ["pipe", "pipe", "pipe", "ipc"],
                  }
                );

                if (logger !== undefined) {
                  child.stdout?.on("data", data => {
                    logger?.info(data.toString().trim());
                  });

                  child.stderr?.on("data", data => {
                    logger?.info(data.toString().trim());
                  });

                  child.on("exit", code => {
                    logger?.info(`Hardhat node process exited with code ${code}`);
                  });

                  child.on("error", err => {
                    logger?.info(`Error in Hardhat node process: ${err.message}`);
                  });
                }

                // Store the process
                this.processes.set(chainName, child);

                // Wait for the network to be ready
                try {
                  await this.waitForNetwork(providerUrl, 30000); // Longer timeout for startup
                  isNetworkReady = true;
                  console.log(`✅ Hardhat node started successfully at ${providerUrl}`);
                } catch (startupError) {
                  throw new NetworkConnectionError(providerUrl, startupError as Error);
                }
              }

              if (isNetworkReady) {
                const provider = new JsonRpcProvider(providerUrl);
                this.instances.set(chainName, provider);
                this.chainStatuses.set(chainName, {
                  name: chainName,
                  status: "running",
                  rpcUrl: providerUrl,
                  port: 8545,
                });
              }
              return;
            }

            this.forkPort = this.forkPort + index;

            // Validate port
            const portValidation = this.validatePort(this.forkPort);
            if (!portValidation.isValid) {
              throw new ChainConfigError(
                chainName,
                `Port validation failed: ${portValidation.errors.join(", ")}`
              );
            }

            const chainConfig = this.getChainConfig(chainName, config);
            if (!chainConfig) {
              throw new ChainConfigError(
                chainName,
                `No configuration found. Ensure RPC URL is configured.`
              );
            }

            // Validate RPC URL
            const urlValidation = this.validateRpcUrl(chainConfig.rpcUrl);
            if (!urlValidation.isValid) {
              throw new ChainConfigError(
                chainName,
                `RPC URL validation failed: ${urlValidation.errors.join(", ")}`
              );
            }

            console.log(`🛠️ Forking ${chainName} on port ${this.forkPort}...`);

            // Initialize chain status
            this.chainStatuses.set(chainName, {
              name: chainName,
              status: "unknown",
              rpcUrl: chainConfig.rpcUrl,
              port: this.forkPort,
              chainId: chainConfig.chainId,
              blockNumber: chainConfig.blockNumber,
            });

            // TODO create a hardhat fork process more directly rather than using the CLI
            const child = fork(
              "node_modules/hardhat/internal/cli/cli.js",
              [
                "node",
                "--fork",
                chainConfig.rpcUrl,
                "--port",
                this.forkPort.toString(),
                ...(chainConfig.blockNumber
                  ? ["--fork-block-number", chainConfig.blockNumber.toString()]
                  : []),
              ],
              {
                env: {
                  ...process.env,
                  HH_CHAIN_ID: chainConfig.chainId?.toString() || "31337",
                },
                stdio: ["pipe", "pipe", "pipe", "ipc"], // Enable stdout & stderr pipes
              }
            );

            if (logger !== undefined) {
              // Handle logs
              child.stdout?.on("data", data => {
                logger?.info(data.toString().trim());
              });

              child.stderr?.on("data", data => {
                // // Separate error log (There shouldn't be errors so we leave it commented out)
                // logger?.error(data.toString().trim());
                logger?.info(data.toString().trim());
              });

              child.on("exit", code => {
                logger?.info(`Forked process for ${chainName} exited with code ${code}`);
                this.chainStatuses.set(chainName, {
                  ...this.chainStatuses.get(chainName)!,
                  status: code === 0 ? "stopped" : "error",
                });
              });

              child.on("error", err => {
                // // Separate error log (There shouldn't be errors so we leave it commented out)
                // logger?.info(`Error in forked process for ${chainConfig.name}: ${err.message}`);

                logger?.info(`Error in forked process for ${chainName}: ${err.message}`);
                this.chainStatuses.set(chainName, {
                  ...this.chainStatuses.get(chainName)!,
                  status: "error",
                });
              });
            }

            // Store process info
            this.processes.set(chainName, child);
            this.chainStatuses.set(chainName, {
              ...this.chainStatuses.get(chainName)!,
              processId: child.pid,
            });

            const providerUrl = "http://127.0.0.1:" + this.forkPort.toString();

            try {
              await this.waitForNetwork(providerUrl, 100000);
              this.chainStatuses.set(chainName, {
                ...this.chainStatuses.get(chainName)!,
                status: "running",
              });
            } catch (err) {
              this.chainStatuses.set(chainName, {
                ...this.chainStatuses.get(chainName)!,
                status: "error",
              });

              if (err instanceof Error) {
                console.log(`Network validation failed for ${chainName}: ${err.message}`);
                throw new NetworkConnectionError(providerUrl, err);
              } else {
                const error = new Error(
                  `Network validation failed for ${chainName}: ${String(err)}`
                );
                throw new NetworkConnectionError(providerUrl, error);
              }
            }

            console.log(`🔗 Connecting to ${chainName} at ${providerUrl}`);
            const provider = new JsonRpcProvider(providerUrl);
            this.instances.set(chainName, provider);
          } catch (error) {
            // Clean up on individual chain failure
            const process = this.processes.get(chainName);
            if (process) {
              try {
                process.kill("SIGINT");
              } catch (killError) {
                console.warn(`Failed to kill process for ${chainName}:`, killError);
              }
              this.processes.delete(chainName);
            }

            this.chainStatuses.set(chainName, {
              name: chainName,
              status: "error",
              rpcUrl: "",
            });

            throw error; // Re-throw to stop setup
          }
        })
      );
    } catch (error) {
      // If any chain fails, cleanup all
      await this.cleanup();
      throw error;
    }

    return this.instances;
  }

  /**
   * Retrieves chain configuration from Hardhat config or environment variables
   * @param chainName Name of the chain to get configuration for
   * @param config Hardhat user configuration
   * @returns ChainConfig object or null if not found
   * @throws ChainConfigError when configuration is invalid or missing
   */
  private static getChainConfig(chainName: string, config: HardhatUserConfig): ChainConfig | null {
    try {
      const configChainId = chainName.toUpperCase() + "_MOCK_CHAIN_ID";
      const chainId =
        config.chainManager?.chains?.[chainName]?.chainId ??
        parseInt(process.env[configChainId] || "31337");

      const envRpcUrl = chainName.toUpperCase() + "_RPC";
      const rpcUrl =
        config.chainManager?.chains?.[chainName]?.rpcUrl ?? process.env[`${envRpcUrl}`];

      if (!rpcUrl) {
        throw new ChainConfigError(
          chainName,
          `Missing required rpcUrl for ${chainName} or ${envRpcUrl} in .env file.`
        );
      }

      const blockNumberEnv = process.env[`${chainName.toUpperCase()}_BLOCK`];
      const blockNumber =
        config.chainManager?.chains?.[chainName]?.blockNumber ??
        (blockNumberEnv ? parseInt(blockNumberEnv) : undefined);

      if (!blockNumber) {
        console.log(
          `No fork block number configured for ${chainName} in either hardhat.config or .env file. No cache, downloading latest blocks.`
        );
      }

      const chainConfig: ChainConfig = {
        rpcUrl: rpcUrl!,
        blockNumber: blockNumber,
        chainId: chainId,
      };

      return chainConfig;
    } catch (error) {
      if (error instanceof ChainConfigError) {
        throw error;
      }
      throw new ChainConfigError(
        chainName,
        `Configuration parsing failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Gets a provider for a specific chain
   * @param chainName Name of the chain to get provider for
   * @returns JsonRpcProvider instance or undefined if chain is not found
   */
  static getProvider(chainName: string): JsonRpcProvider | undefined {
    // Handle null/undefined input
    if (!chainName) {
      return undefined;
    }

    // Validate chain name
    const validation = this.validateChainName(chainName);
    if (!validation.isValid) {
      console.warn(`Invalid chain name '${chainName}': ${validation.errors.join(", ")}`);
      return undefined;
    }

    return this.instances.get(chainName);
  }

  /**
   * Gets all active providers
   * @returns Map of chain names to JsonRpcProvider instances
   */
  static getProviders(): MultiChainProviders {
    return this.instances;
  }

  /**
   * Get the status of a specific chain
   * @param chainName Name of the chain to check status for
   * @returns Current status of the chain
   */
  static getChainStatus(chainName: string): ChainStatus["status"] {
    // Handle null/undefined input
    if (!chainName) {
      return "unknown";
    }

    const status = this.chainStatuses.get(chainName);
    return status?.status || "unknown";
  }

  /**
   * Get detailed status information for a chain
   * @param chainName Name of the chain to get detailed status for
   * @returns Detailed ChainStatus object or undefined if chain not found
   */
  static getChainStatusDetails(chainName: string): ChainStatus | undefined {
    return this.chainStatuses.get(chainName);
  }

  /**
   * Get status for all chains
   * @returns Map of chain names to their detailed status information
   */
  static getAllChainStatuses(): Map<string, ChainStatus> {
    return new Map(this.chainStatuses);
  }

  /**
   * Validate network connectivity
   * @param url The network URL to validate
   * @param timeout Timeout in milliseconds (default: 30000)
   * @returns Promise resolving to true if network is accessible, false otherwise
   */
  static async validateNetwork(url: string, timeout: number = 30000): Promise<boolean> {
    try {
      await this.waitForNetwork(url, timeout);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cleans up all forked processes and providers
   * @returns Promise that resolves when cleanup is complete
   */
  static async cleanup(): Promise<void> {
    console.log("🧹 Cleaning up forked chains...");

    const cleanupPromises: Promise<void>[] = [];
    const errors: ProcessCleanupError[] = [];

    this.processes.forEach((process, name) => {
      console.log(`💀 Killing forked process for: ${name}`);

      const cleanupPromise = new Promise<void>(resolve => {
        if (!process || process.killed) {
          resolve();
          return;
        }

        // Set a timeout for process cleanup
        const timeout = setTimeout(() => {
          if (!process.killed) {
            try {
              process.kill("SIGKILL");
            } catch (error) {
              errors.push(new ProcessCleanupError(name, error as Error));
            }
          }
          resolve();
        }, 5000);

        process.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });

        try {
          process.kill("SIGINT");
        } catch (killError) {
          clearTimeout(timeout);
          errors.push(new ProcessCleanupError(name, killError as Error));
          resolve();
        }
      });

      cleanupPromises.push(cleanupPromise);
    });

    // Wait for all cleanup operations
    await Promise.all(cleanupPromises);

    // Clear all maps
    this.processes.clear();
    this.instances.clear();
    this.chainStatuses.clear();

    // Log errors if any occurred during cleanup
    if (errors.length > 0) {
      console.warn(`Cleanup completed with ${errors.length} errors:`);
      errors.forEach(error => console.warn(`  - ${error.message}`));
    } else {
      console.log("✅ All forked chains cleaned up successfully");
    }
  }

  /**
   * Waits for a network to become available
   * @param url The network URL to wait for
   * @param timeout Timeout in milliseconds (default: 30000)
   * @returns Promise that resolves when network is ready
   * @throws NetworkConnectionError when network is not accessible within timeout
   */
  static async waitForNetwork(url: string, timeout: number = 30000): Promise<void> {
    // Validate URL first
    const urlValidation = this.validateRpcUrl(url);
    if (!urlValidation.isValid) {
      throw new NetworkConnectionError(
        url,
        new Error(`Invalid URL: ${urlValidation.errors.join(", ")}`)
      );
    }

    const provider = new JsonRpcProvider(url);
    const startTime = Date.now();
    let lastError: Error | undefined;

    while (Date.now() - startTime < timeout) {
      try {
        await provider.getBlockNumber(); // Check if the network is responding
        console.log(`Network at ${url} is ready.`);
        return;
      } catch (error) {
        lastError = error as Error;
        // Only log if we're not in a test environment or if there's still time left
        const timeRemaining = timeout - (Date.now() - startTime);
        if (timeRemaining > 1000 && process.env.NODE_ENV !== "test") {
          console.log(`Waiting for network at ${url}...`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    throw new NetworkConnectionError(
      url,
      lastError || new Error(`Network at ${url} did not respond within ${timeout}ms`)
    );
  }

  /**
   * Creates a winston logger instance for a specific fork
   * @param forkName Name of the fork to create logger for
   * @param logDir Optional directory to store logs (default: ./logs)
   * @returns Winston Logger instance
   */
  static createForkLogger = (forkName: string, logDir?: string): Logger => {
    return createLogger({
      level: "info",
      format: format.combine(
        format.colorize(),
        // // formatted with timestamp and level
        // format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        // format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`)

        // formatted with message only
        format.printf(({ message }) => `[${message}`)
      ),
      transports: [
        new transports.File({
          filename: logDir ? `${logDir}/${forkName}-node.log` : `./logs/${forkName}-node.log`,
          level: "info",
          options: { flags: "w" },
        }),
        // // Console logger
        // new transports.Console({
        //   format: format.combine(format.colorize(), format.simple()),
        // }),
        // // Error logger
        // new transports.File({
        //   filename: logDir ? `${logDir}/${forkName}-error.log` : `./logs/${forkName}-error.log`,
        //   level: "error",
        //   options: { flags: "w" },
        // }),
      ],
    });
  };
}

export default ChainManager;
