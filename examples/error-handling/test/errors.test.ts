import { expect } from "chai";
import ChainManager, { ChainConfigError, NetworkConnectionError } from "../../../src/chainManager";

describe("Error Handling and Recovery", function () {
  this.timeout(60000);

  afterEach(async function () {
    // Always clean up after each test
    try {
      await ChainManager.cleanup();
    } catch {
      // Ignore cleanup errors in tests
    }
  });

  describe("Configuration Error Handling", function () {
    it("should throw ChainConfigError for empty chain name", async function () {
      const config = { chainManager: { chains: {} } };

      try {
        await ChainManager.setupChains([""], config);
        expect.fail("Expected ChainConfigError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(ChainConfigError);
        expect(error.message).to.include("Chain name cannot be empty");
        expect(error.name).to.equal("ChainConfigError");
      }
    });

    it("should throw ChainConfigError for invalid chain name characters", async function () {
      const config = { chainManager: { chains: {} } };

      try {
        await ChainManager.setupChains(["test@chain!"], config);
        expect.fail("Expected ChainConfigError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(ChainConfigError);
        expect(error.message).to.include(
          "can only contain letters, numbers, underscores, and hyphens"
        );
      }
    });

    it("should throw ChainConfigError for missing RPC URL", async function () {
      const config = {
        chainManager: {
          chains: {
            testchain: {
              chainId: 1,
              rpcUrl: "", // Empty to trigger validation error
            },
          },
        },
      };

      try {
        await ChainManager.setupChains(["testchain"], config);
        expect.fail("Expected ChainConfigError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(ChainConfigError);
        if (error instanceof ChainConfigError) {
          expect(error.message).to.include("Missing required rpcUrl");
        }
      }
    });

    it("should throw ChainConfigError for empty RPC URL", async function () {
      const config = {
        chainManager: {
          chains: {
            testchain: {
              chainId: 1,
              rpcUrl: "",
            },
          },
        },
      };

      try {
        await ChainManager.setupChains(["testchain"], config);
        expect.fail("Expected ChainConfigError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(ChainConfigError);
        if (error instanceof ChainConfigError) {
          expect(error.message).to.include("RPC URL cannot be empty");
        }
      }
    });

    it("should throw ChainConfigError for invalid RPC URL format", async function () {
      const config = {
        chainManager: {
          chains: {
            testchain: {
              chainId: 1,
              rpcUrl: "not-a-valid-url",
            },
          },
        },
      };

      try {
        await ChainManager.setupChains(["testchain"], config);
        expect.fail("Expected ChainConfigError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(ChainConfigError);
        if (error instanceof ChainConfigError) {
          expect(error.message).to.include("Invalid RPC URL format");
        }
      }
    });
  });

  describe("Network Error Handling", function () {
    it("should handle unreachable RPC endpoints", async function () {
      const config = {
        chainManager: {
          chains: {
            testchain: {
              chainId: 1,
              rpcUrl: "http://localhost:99999", // Non-existent endpoint
            },
          },
        },
      };

      try {
        await ChainManager.setupChains(["testchain"], config);
        expect.fail("Expected NetworkConnectionError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(NetworkConnectionError);
        if (error instanceof NetworkConnectionError) {
          expect(error.message).to.include("Failed to connect to network");
          expect(error.message).to.include("http://localhost:99999");

          // Check that original error is preserved
          expect(error.originalError).to.be.instanceOf(Error);
        }
      }
    });

    it("should handle invalid API key in RPC URL", async function () {
      const config = {
        chainManager: {
          chains: {
            testchain: {
              chainId: 11155111,
              rpcUrl: "https://sepolia.infura.io/v3/invalid-key",
            },
          },
        },
      };

      try {
        await ChainManager.setupChains(["testchain"], config);
        expect.fail("Expected NetworkConnectionError was not thrown");
      } catch (error) {
        expect(error).to.be.instanceOf(NetworkConnectionError);
        if (error instanceof NetworkConnectionError) {
          expect(error.message).to.include("Failed to connect to network");
        }
      }
    });
  });

  describe("Validation Methods", function () {
    it("should validate network connectivity", async function () {
      // Test with invalid URL
      const isValid1 = await ChainManager.validateNetwork("invalid-url");
      expect(isValid1).to.be.false;

      // Test with unreachable endpoint
      const isValid2 = await ChainManager.validateNetwork("http://localhost:99999", 1000);
      expect(isValid2).to.be.false;

      // Test with valid hardhat endpoint (may fail if not running, which is expected)
      const isValid3 = await ChainManager.validateNetwork("http://127.0.0.1:8545", 1000);
      // Don't assert this as it depends on external service
      expect(typeof isValid3).to.equal("boolean");
    });
  });

  describe("Provider Error Handling", function () {
    it("should return undefined for non-existent chain", function () {
      const provider = ChainManager.getProvider("nonexistent");
      expect(provider).to.be.undefined;
    });

    it("should handle invalid chain names gracefully", function () {
      const provider1 = ChainManager.getProvider("");
      expect(provider1).to.be.undefined;

      const provider2 = ChainManager.getProvider("invalid@name");
      expect(provider2).to.be.undefined;
    });

    it("should return unknown status for non-existent chain", function () {
      const status = ChainManager.getChainStatus("nonexistent");
      expect(status).to.equal("unknown");
    });
  });

  describe("Cleanup Error Handling", function () {
    it("should handle cleanup with no active processes", async function () {
      // Should not throw even when no processes are running
      await ChainManager.cleanup();

      // Verify clean state
      const providers = ChainManager.getProviders();
      expect(providers.size).to.equal(0);
    });

    it("should handle multiple cleanup calls", async function () {
      // Multiple cleanup calls should not cause issues
      await ChainManager.cleanup();
      await ChainManager.cleanup();
      await ChainManager.cleanup();

      const providers = ChainManager.getProviders();
      expect(providers.size).to.equal(0);
    });
  });

  describe("Error Recovery Patterns", function () {
    it("should demonstrate proper error handling pattern", async function () {
      const validConfig = {
        chainManager: {
          chains: {
            hardhat: {
              chainId: 31337,
              rpcUrl: "http://127.0.0.1:8545",
            },
          },
        },
      };

      const invalidConfig = {
        chainManager: {
          chains: {
            invalid: {
              chainId: 1,
              rpcUrl: "http://localhost:99999",
            },
          },
        },
      };

      // Try invalid config first
      let setupFailed = false;
      try {
        await ChainManager.setupChains(["invalid"], invalidConfig);
      } catch (error) {
        setupFailed = true;
        if (error instanceof Error) {
          console.log("✅ Caught expected error:", error.message);
        }

        // Ensure cleanup happened
        const providers = ChainManager.getProviders();
        expect(providers.size).to.equal(0);
      }

      expect(setupFailed).to.be.true;

      // Now try with valid config (hardhat network)
      // Note: This might still fail if hardhat network isn't running, which is fine for this test
      try {
        await ChainManager.setupChains(["hardhat"], validConfig);
        console.log("✅ Successfully set up hardhat chain");
      } catch (error) {
        if (error instanceof Error) {
          console.log("ℹ️  Hardhat network not available (expected in CI):", error.message);
        }
        // This is expected in CI environments where hardhat network isn't running
      }
    });

    it("should demonstrate partial setup failure handling", async function () {
      const mixedConfig = {
        chainManager: {
          chains: {
            hardhat: {
              chainId: 31337,
              rpcUrl: "http://127.0.0.1:8545",
            },
            invalid: {
              chainId: 1,
              rpcUrl: "http://localhost:99999",
            },
          },
        },
      };

      // When one chain fails, all should fail and cleanup should occur
      try {
        await ChainManager.setupChains(["hardhat", "invalid"], mixedConfig);
        expect.fail("Expected setup to fail due to invalid chain");
      } catch {
        // Verify cleanup occurred
        const providers = ChainManager.getProviders();
        expect(providers.size).to.equal(0);

        console.log("✅ Setup correctly failed and cleaned up after partial failure");
      }
    });
  });

  describe("Error Message Quality", function () {
    it("should provide helpful error messages", async function () {
      type TestConfig = {
        chainManager: { chains: Record<string, unknown> };
      };

      type TestCase = {
        chains: string[];
        config: TestConfig;
        expectedMessage: string;
      };

      const testCases: TestCase[] = [
        {
          chains: [""],
          config: { chainManager: { chains: {} } },
          expectedMessage: "Chain name cannot be empty",
        },
        {
          chains: ["test@chain"],
          config: { chainManager: { chains: {} } },
          expectedMessage: "can only contain letters, numbers, underscores, and hyphens",
        },
        {
          chains: ["test"],
          config: {
            chainManager: {
              chains: {
                test: { chainId: 1, rpcUrl: "invalid-url" },
              },
            },
          },
          expectedMessage: "Invalid RPC URL format",
        },
      ];

      for (const testCase of testCases) {
        try {
          // Type assertion needed because we're intentionally testing invalid configs
          await ChainManager.setupChains(testCase.chains, testCase.config as never);
          expect.fail(`Expected error for chains: ${testCase.chains}`);
        } catch (error) {
          if (error instanceof Error) {
            expect(error.message).to.include(testCase.expectedMessage);
            console.log(`✅ Error message check passed: ${testCase.expectedMessage}`);
          }
        }
      }
    });
  });
});
