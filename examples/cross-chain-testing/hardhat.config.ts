import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "hardhat-multichain";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  defaultNetwork: "hardhat",

  chainManager: {
    chains: {
      // Ethereum for main protocol deployment
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC || "https://ethereum-rpc.publicnode.com",
        chainId: 1,
        blockNumber: 18500000,
      },

      // Polygon for L2 testing
      polygon: {
        rpcUrl: process.env.POLYGON_RPC || "https://polygon-rpc.com",
        chainId: 137,
        blockNumber: 48000000,
      },

      // Arbitrum for L2 comparison
      arbitrum: {
        rpcUrl: process.env.ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc",
        chainId: 42161,
        blockNumber: 140000000,
      },
    },
  },

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000",
      },
    },
  },

  mocha: {
    timeout: 300000, // 5 minutes for complex cross-chain tests
  },
};

export default config;
