import { HardhatUserConfig } from "hardhat/types";
import "../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  chainManager: {
    chains: {
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC || "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
        chainId: 1,
        blockNumber: 18500000,
      },
      polygon: {
        rpcUrl: process.env.POLYGON_RPC || "https://polygon-rpc.com",
        chainId: 137,
        blockNumber: 50000000,
      },
    },
  },
};

export default config;
