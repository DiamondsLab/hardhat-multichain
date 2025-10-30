// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";
import * as dotenv from "dotenv";

// Import the plugin from the built dist folder
import "../../../dist/index";
import "../../../dist/type-extensions"; // Import type extensions

// Load environment variables
dotenv.config({ path: "../../../.env" });

// Extract environment variables
const {
  MAINNET_RPC,
  SEPOLIA_RPC,
  MAINNET_BLOCK,
  SEPOLIA_BLOCK,
  MAINNET_MOCK_CHAIN_ID,
  SEPOLIA_MOCK_CHAIN_ID,
} = process.env;

const mainnetUrl: string = MAINNET_RPC || "";
const sepoliaUrl: string = SEPOLIA_RPC || "";
const mainnetBlock: number = parseInt(MAINNET_BLOCK || "0");
const sepoliaBlock: number = parseInt(SEPOLIA_BLOCK || "0");

const config: HardhatUserConfig = {
  solidity: "0.7.3",
  defaultNetwork: "hardhat",
  paths: {},
  chainManager: {
    chains: {
      mainnet: {
        rpcUrl: mainnetUrl,
        blockNumber: mainnetBlock > 0 ? mainnetBlock : undefined,
        chainId: MAINNET_MOCK_CHAIN_ID ? parseInt(MAINNET_MOCK_CHAIN_ID) : 11111169,
      },
      sepolia: {
        rpcUrl: sepoliaUrl,
        blockNumber: sepoliaBlock > 0 ? sepoliaBlock : undefined,
        chainId: SEPOLIA_MOCK_CHAIN_ID ? parseInt(SEPOLIA_MOCK_CHAIN_ID) : 11169111,
      },
      testnet: {
        rpcUrl: sepoliaUrl,
        chainId: 11155111,
        blockNumber: sepoliaBlock > 0 ? sepoliaBlock : undefined,
      },
    },
  },
};

export default config;
