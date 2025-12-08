import { JsonRpcProvider } from "ethers";
import { extendConfig, extendEnvironment, task } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ChainManager, {
  ChainConfigError,
  NetworkConnectionError,
  ProcessCleanupError,
} from "./chainManager";
import { MultiChainConfig, MultiChainProviders, TaskArgs } from "./type-extensions"; // Import MultiChainConfig

export function getProvider(networkName: string): JsonRpcProvider {
  const provider = ChainManager.getProvider(networkName);
  if (!provider) {
    throw new Error(
      `Provider for network ${networkName} not found. Ensure the chain is properly configured and running.`
    );
  }
  return provider;
}

export function getMultichainProviders(): MultiChainProviders {
  return ChainManager.getProviders();
}

// Export error classes for external use
export { ChainConfigError, NetworkConnectionError, ProcessCleanupError };

  export { default as multichain } from "./chainManager";

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  hre.multichain = lazyObject(() => {
    return ChainManager.getProviders();
  });
});

extendConfig((config, userConfig) => {
  const defaultChainManager: MultiChainConfig = {
    chains: {},
  };

  config.chainManager = {
    ...defaultChainManager,
    ...userConfig.chainManager,
  };
});

task("test-multichain", "Launches multiple forked Hardhat networks")
  .addOptionalVariadicPositionalParam("testFiles", "Test files to run")
  .addParam("chains", "Comma-separated list of chain names to fork", "")
  .addOptionalParam("logs", "Log directory for forked chain output", "")
  .setAction(async ({ chains, logs, testFiles }, hre) => {
    if (!chains) {
      console.log("No secondary chains specified.");
      return;
    }

    const logsDir: string | undefined = (logs as TaskArgs["logs"]) || undefined;
    const chainNames: string[] = (chains as TaskArgs["chains"])
      .split(",")
      .map((name: string) => name.trim());

    if (chainNames.length === 0) {
      console.log("No valid chain names provided.");
      return;
    }

    let cleanupRegistered = false;

    try {
      console.log(`🔄 Launching forks for: ${chainNames.join(", ")}`);
      await ChainManager.setupChains(chainNames, hre.userConfig, logsDir ? logsDir : undefined);
      console.log("✅ Forked chains launched successfully."); 

      // Register cleanup handlers only after successful setup
      if (!cleanupRegistered) {
        const cleanup = async () => {
          console.log("Exiting. Cleaning up forked networks...");
          try {
            await ChainManager.cleanup();
          } catch (error) {
            console.error("Error during cleanup:", error);
          }
        };

        process.on("exit", cleanup);
        process.on("SIGINT", async () => {
          await cleanup();
          process.exit(0);
        });
        process.on("SIGTERM", async () => {
          await cleanup();
          process.exit(0);
        });

        cleanupRegistered = true;
      }

      if (testFiles && testFiles.length > 0) {
        console.log(`🧪 Running tests: ${testFiles.join(", ")}`);
        await hre.run("test", { testFiles });
      } else {
        console.log("No test files specified. Running all tests...");
        await hre.run("test");
      }
    } catch (error) {
      console.error("❌ Error during multichain setup or testing:");

      if (error instanceof ChainConfigError) {
        console.error(`Configuration Error: ${error.message}`);
      } else if (error instanceof NetworkConnectionError) {
        console.error(`Network Connection Error: ${error.message}`);
        console.error("Please check your RPC URLs and network connectivity.");
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error("Unknown error:", error);
      }

      // Cleanup on error
      try {
        await ChainManager.cleanup();
      } catch (cleanupError) {
        console.error("Additional error during cleanup:", cleanupError);
      }

      throw error;
    }
  });

export { };

