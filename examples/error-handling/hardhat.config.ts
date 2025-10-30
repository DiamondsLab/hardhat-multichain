import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "hardhat-multichain";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",

  chainManager: {
    chains: {
      // Valid chain with good RPC
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC || "https://ethereum-rpc.publicnode.com",
        chainId: 1,
        blockNumber: 18500000,
      },

      // This chain will be used to test invalid RPC handling
      testnet: {
        rpcUrl: process.env.TESTNET_RPC || "https://sepolia.infura.io/v3/test",
        chainId: 11155111,
      },
    },
  },

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 5,
        accountsBalance: "10000000000000000000000",
      },
    },
  },

  mocha: {
    timeout: 60000,
  },
};

export default config;
