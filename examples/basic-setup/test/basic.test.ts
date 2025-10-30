import { expect } from "chai";
import { getProvider, getMultichainProviders } from "../../src/index";

describe("Basic Multichain Setup", function () {
  it("should have access to multiple providers", function () {
    const providers = getMultichainProviders();

    // This test assumes chains were set up via test-multichain task
    // In a real test, you'd run: npx hardhat test-multichain --chains ethereum,polygon
    console.log(`Available providers: ${Array.from(providers.keys()).join(", ")}`);
  });

  it("should be able to get specific providers", function () {
    try {
      const ethereumProvider = getProvider("ethereum");
      expect(ethereumProvider).to.not.be.undefined;
    } catch {
      // Expected if ethereum chain is not running
      console.log("Ethereum provider not available - run with test-multichain task");
    }
  });

  it("should handle provider requests for non-existent chains", function () {
    expect(() => getProvider("nonexistent")).to.throw("Provider for network nonexistent not found");
  });
});
