import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "hardhat-multichain";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",

  // Advanced multichain configuration
  chainManager: {
    chains: {
      // Ethereum Mainnet fork
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC || "https://ethereum-rpc.publicnode.com",
        chainId: 1,
        blockNumber: 18500000, // Fork from specific block for consistency
      },

      // Polygon Mainnet fork
      polygon: {
        rpcUrl: process.env.POLYGON_RPC || "https://polygon-rpc.com",
        chainId: 137,
        blockNumber: 48000000,
      },

      // Arbitrum One fork
      arbitrum: {
        rpcUrl: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
        chainId: 42161,
        blockNumber: 140000000,
      },

      // Optimism fork
      optimism: {
        rpcUrl: process.env.OPTIMISM_RPC || "https://mainnet.optimism.io",
        chainId: 10,
        blockNumber: 110000000,
      },

      // BSC fork
      bsc: {
        rpcUrl: process.env.BSC_RPC || "https://bsc-dataseed1.binance.org",
        chainId: 56,
        blockNumber: 32000000,
      },

      // Base fork
      base: {
        rpcUrl: process.env.BASE_RPC || "https://mainnet.base.org",
        chainId: 8453,
        blockNumber: 5000000,
      },
    },
  },

  networks: {
    hardhat: {
      // Allow unlimited contract size for testing
      allowUnlimitedContractSize: true,
      accounts: {
        // Use deterministic accounts for testing
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
        accountsBalance: "10000000000000000000000", // 10,000 ETH per account
      },
    },
  },

  mocha: {
    timeout: 120000, // Longer timeout for multi-chain tests
  },
};

export default config;
