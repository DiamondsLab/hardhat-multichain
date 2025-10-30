import { expect } from "chai";
import { ethers } from "hardhat";
import ChainManager from "../../../src/chainManager";
import { getProvider, getMultichainProviders } from "../../../src/index";

describe("Advanced Multi-Chain Configuration", function () {
  this.timeout(120000); // Extended timeout for network operations

  const testChains = ["ethereum", "polygon", "arbitrum"];

  before(async function () {
    console.log("Setting up multiple blockchain forks...");
    const config = require("../hardhat.config").default;

    try {
      await ChainManager.setupChains(testChains, config);
      console.log("✅ All chains set up successfully");
    } catch (error) {
      console.error("❌ Failed to set up chains:", error);
      throw error;
    }
  });

  after(async function () {
    console.log("Cleaning up blockchain forks...");
    await ChainManager.cleanup();
    console.log("✅ Cleanup completed");
  });

  describe("Multi-chain setup", function () {
    it("should have all configured chains available", function () {
      const providers = getMultichainProviders();

      for (const chainName of testChains) {
        expect(providers.has(chainName), `${chainName} should be available`).to.be.true;

        const provider = getProvider(chainName);
        expect(provider, `${chainName} provider should exist`).to.not.be.undefined;
      }
    });

    it("should have correct chain IDs", async function () {
      const expectedChainIds = {
        ethereum: 1,
        polygon: 137,
        arbitrum: 42161,
      };

      for (const [chainName, expectedChainId] of Object.entries(expectedChainIds)) {
        const provider = getProvider(chainName);
        const network = await provider.getNetwork();

        expect(network.chainId).to.equal(
          expectedChainId,
          `${chainName} should have chain ID ${expectedChainId}`
        );
      }
    });

    it("should be able to get block numbers from all chains", async function () {
      for (const chainName of testChains) {
        const provider = getProvider(chainName);
        const blockNumber = await provider.getBlockNumber();

        expect(blockNumber).to.be.a("number");
        expect(blockNumber).to.be.greaterThan(0, `${chainName} should have a valid block number`);

        console.log(`📦 ${chainName} current block: ${blockNumber}`);
      }
    });

    it("should be able to query ETH balance on all chains", async function () {
      // Use a well-known address with ETH balance
      const vitalikAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

      for (const chainName of testChains) {
        const provider = getProvider(chainName);
        const balance = await provider.getBalance(vitalikAddress);

        expect(balance).to.be.a("object"); // BigNumber
        console.log(
          `💰 ${chainName} balance for ${vitalikAddress}: ${ethers.utils.formatEther(balance)} ETH`
        );
      }
    });
  });

  describe("Chain-specific features", function () {
    it("should handle Ethereum mainnet specifics", async function () {
      const provider = getProvider("ethereum");
      const network = await provider.getNetwork();

      expect(network.name).to.equal("homestead");
      expect(network.chainId).to.equal(1);
    });

    it("should handle Polygon specifics", async function () {
      const provider = getProvider("polygon");
      const network = await provider.getNetwork();

      expect(network.chainId).to.equal(137);

      // Check for MATIC balance at a known address
      const polygonFoundationAddress = "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0";
      const balance = await provider.getBalance(polygonFoundationAddress);

      console.log(`🟣 Polygon balance: ${ethers.utils.formatEther(balance)} MATIC`);
    });

    it("should handle Arbitrum specifics", async function () {
      const provider = getProvider("arbitrum");
      const network = await provider.getNetwork();

      expect(network.chainId).to.equal(42161);
    });
  });

  describe("Cross-chain comparisons", function () {
    it("should show different block times across chains", async function () {
      const blockInfos: Record<
        string,
        { blockNumber: number; timestamp: number | null; chainName: string }
      > = {};

      for (const chainName of testChains) {
        const provider = getProvider(chainName);
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);

        blockInfos[chainName] = {
          blockNumber,
          timestamp: block ? block.timestamp : null,
          chainName,
        };
      }

      console.log("📊 Cross-chain block comparison:");
      console.table(blockInfos);

      // Verify we have different data for each chain
      const chainNames = Object.keys(blockInfos);
      for (let i = 0; i < chainNames.length - 1; i++) {
        const chain1 = chainNames[i];
        const chain2 = chainNames[i + 1];

        // Block numbers should generally be different (unless by coincidence)
        // Mainly checking that we're getting real data
        expect(blockInfos[chain1].number).to.be.a("number");
        expect(blockInfos[chain2].number).to.be.a("number");
      }
    });
  });
});
