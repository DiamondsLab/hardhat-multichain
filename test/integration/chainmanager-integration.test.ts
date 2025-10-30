import { expect } from "chai";
import ChainManager from "../../src/chainManager";
import { HardhatUserConfig } from "hardhat/types";

describe("ChainManager Integration Tests", function () {
  // Set timeout for individual tests to 15 seconds
  jest.setTimeout(15000);

  afterEach(async function () {
    await ChainManager.cleanup();
  });

  describe("Basic Functionality", function () {
    it("should validate chain configuration", async function () {
      console.log("🔧 Testing configuration validation...");

      const validConfig: HardhatUserConfig = {
        chainManager: {
          chains: {
            testchain: {
              rpcUrl: "http://127.0.0.1:8545",
              chainId: 31337,
            },
          },
        },
      };

      // Test that configuration is properly parsed
      const chainConfig = (ChainManager as any).getChainConfig("testchain", validConfig);
      expect(chainConfig).to.not.be.null;
      expect(chainConfig.rpcUrl).to.equal("http://127.0.0.1:8545");
      expect(chainConfig.chainId).to.equal(31337);

      console.log("✅ Configuration validation working");
    });

    it("should handle chain status management", async function () {
      console.log("🔧 Testing chain status management...");

      // Test status for non-existent chain
      const unknownStatus = ChainManager.getChainStatus("nonexistent");
      expect(unknownStatus).to.equal("unknown");

      // Test status details for non-existent chain
      const unknownDetails = ChainManager.getChainStatusDetails("nonexistent");
      expect(unknownDetails).to.be.undefined;

      // Test getting all statuses
      const allStatuses = ChainManager.getAllChainStatuses();
      expect(allStatuses).to.be.instanceOf(Map);

      console.log("✅ Chain status management working");
    });

    it("should handle provider management", async function () {
      console.log("🔧 Testing provider management...");

      // Test getting provider for non-existent chain
      const unknownProvider = ChainManager.getProvider("nonexistent");
      expect(unknownProvider).to.be.undefined;

      // Test getting all providers
      const allProviders = ChainManager.getProviders();
      expect(allProviders).to.be.instanceOf(Map);

      console.log("✅ Provider management working");
    });

    it("should handle cleanup properly", async function () {
      console.log("🔧 Testing cleanup functionality...");

      // Test cleanup with no active chains
      await ChainManager.cleanup();

      const allProviders = ChainManager.getProviders();
      expect(allProviders.size).to.equal(0);

      const allStatuses = ChainManager.getAllChainStatuses();
      expect(allStatuses.size).to.equal(0);

      console.log("✅ Cleanup functionality working");
    });
  });

  describe("Error Handling", function () {
    it("should handle missing chain configuration", async function () {
      console.log("🔧 Testing missing chain configuration...");

      const emptyConfig: HardhatUserConfig = {
        chainManager: { chains: {} },
      };

      try {
        await ChainManager.setupChains(["nonexistent"], emptyConfig);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.include("nonexistent");
      }

      console.log("✅ Missing chain configuration handled");
    });

    it("should handle invalid chain names", async function () {
      console.log("🔧 Testing invalid chain names...");

      // Test with null/undefined chain name
      const nullProvider = ChainManager.getProvider(null as any);
      expect(nullProvider).to.be.undefined;

      const undefinedProvider = ChainManager.getProvider(undefined as any);
      expect(undefinedProvider).to.be.undefined;

      // Test with empty chain name
      const emptyProvider = ChainManager.getProvider("");
      expect(emptyProvider).to.be.undefined;

      console.log("✅ Invalid chain names handled");
    });

    it("should handle network validation with timeouts", async function () {
      console.log("🔧 Testing network validation...");

      // Test with invalid URL (should be fast to fail)
      const invalidUrl = "http://invalid-url-that-does-not-exist.com";
      const invalidResult = await ChainManager.validateNetwork(invalidUrl, 3000);
      expect(invalidResult).to.be.false;

      // Test with malformed URL
      const malformedUrl = "not-a-url";
      const malformedResult = await ChainManager.validateNetwork(malformedUrl, 1000);
      expect(malformedResult).to.be.false;

      console.log("✅ Network validation working");
    });
  });

  describe("Configuration Validation", function () {
    it("should validate chain configuration parsing", async function () {
      console.log("🔧 Testing configuration parsing...");

      const config: HardhatUserConfig = {
        chainManager: {
          chains: {
            testchain: {
              rpcUrl: "http://127.0.0.1:8545",
              chainId: 31337,
              blockNumber: 12345,
            },
          },
        },
      };

      try {
        const chainConfig = (ChainManager as any).getChainConfig("testchain", config);
        expect(chainConfig).to.not.be.null;
        expect(chainConfig.rpcUrl).to.equal("http://127.0.0.1:8545");
        expect(chainConfig.chainId).to.equal(31337);
        expect(chainConfig.blockNumber).to.equal(12345);
      } catch (error) {
        expect.fail(`Configuration parsing should not fail: ${error}`);
      }

      console.log("✅ Configuration parsing working");
    });

    it("should handle missing RPC URL", async function () {
      console.log("🔧 Testing missing RPC URL...");

      const configWithoutRpc: HardhatUserConfig = {
        chainManager: {
          chains: {
            testchain: {
              chainId: 31337,
            } as any, // Cast to any since we're testing missing rpcUrl
          },
        },
      };

      try {
        (ChainManager as any).getChainConfig("testchain", configWithoutRpc);
        expect.fail("Should have thrown an error for missing RPC URL");
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.include("rpcUrl");
      }

      console.log("✅ Missing RPC URL handled");
    });

    it("should handle environment variable fallback", async function () {
      console.log("🔧 Testing environment variable fallback...");

      // Set environment variable
      process.env.TESTCHAIN_RPC = "http://test-env-url.com";
      process.env.TESTCHAIN_MOCK_CHAIN_ID = "999";

      const configWithEnv: HardhatUserConfig = {
        chainManager: {
          chains: {
            testchain: {} as any, // Cast to any since we're testing env var fallback
          },
        },
      };

      try {
        const chainConfig = (ChainManager as any).getChainConfig("testchain", configWithEnv);
        expect(chainConfig).to.not.be.null;
        expect(chainConfig.rpcUrl).to.equal("http://test-env-url.com");
        expect(chainConfig.chainId).to.equal(999);
      } catch (error) {
        expect.fail(`Environment variable fallback should work: ${error}`);
      } finally {
        // Clean up environment variables
        delete process.env.TESTCHAIN_RPC;
        delete process.env.TESTCHAIN_MOCK_CHAIN_ID;
      }

      console.log("✅ Environment variable fallback working");
    });
  });
});
