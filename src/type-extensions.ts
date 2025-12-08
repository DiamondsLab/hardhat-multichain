import { JsonRpcProvider } from "ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";
import ChainManager from "./chainManager";

export interface ChainConfig {
  rpcUrl: string;
  blockNumber?: number;
  chainId?: number;
}

export interface ChainStatus {
  name: string;
  status: "running" | "stopped" | "error" | "unknown";
  port?: number;
  blockNumber?: number;
  chainId?: number;
  rpcUrl: string;
  processId?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SetupOptions {
  timeout?: number;
  retries?: number;
  logLevel?: "silent" | "error" | "warn" | "info" | "debug";
}

export interface MultiChainConfig {
  chains: Record<string, ChainConfig>;
}

export interface TaskArgs {
  chains: string;
  logs?: string;
}

export type MultiChainProviders = Map<string, JsonRpcProvider>;

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    multichain: ChainManager;
    chainManager: MultiChainConfig;
    // getProvider(newNetwork: string): JsonRpcProvider;
  }
}

declare module "hardhat/types/config" {
  export interface HardhatUserConfig {
    chainManager?: MultiChainConfig;
  }

  export interface HardhatConfig {
    chainManager: MultiChainConfig;
  }
}
