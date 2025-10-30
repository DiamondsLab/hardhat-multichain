import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import ChainManager from "../../../src/chainManager";
import { getProvider } from "../../../src/index";

interface DeploymentInfo {
  contract: Contract;
  deploymentGas: number;
  chainId: number;
  chainName: string;
  blockNumber: number;
}

describe("Cross-Chain Contract Deployment and Testing", function () {
  this.timeout(300000); // 5 minutes for complex operations

  const chains = ["ethereum", "polygon", "arbitrum"];
  const deployments: Record<string, DeploymentInfo> = {};
  let deployer: Signer;

  before(async function () {
    console.log("🚀 Setting up cross-chain testing environment...");

    // Setup chains
    const config = require("../hardhat.config").default;
    await ChainManager.setupChains(chains, config);

    // Get deployer account
    const signers = await ethers.getSigners();
    deployer = signers[0];

    console.log("✅ Cross-chain environment ready");
  });

  after(async function () {
    console.log("🧹 Cleaning up cross-chain environment...");
    await ChainManager.cleanup();
  });

  describe("Multi-Chain Contract Deployment", function () {
    it("should deploy contracts to all chains", async function () {
      console.log("📦 Deploying contracts across chains...");

      for (const chainName of chains) {
        console.log(`\n🔗 Deploying to ${chainName}...`);

        const provider = getProvider(chainName);
        const signer = deployer.connect(provider);

        // Get contract factory
        const CrossChainRegistry = await ethers.getContractFactory("CrossChainRegistry");

        // Deploy with chain-specific name
        const contract = await CrossChainRegistry.connect(signer).deploy(
          `${chainName.charAt(0).toUpperCase()}${chainName.slice(1)} Registry`
        );

        const receipt = await contract.deployTransaction.wait();
        const gasUsed = receipt.gasUsed.toNumber();

        // Get chain info
        const network = await provider.getNetwork();
        const currentBlock = await provider.getBlockNumber();

        deployments[chainName] = {
          contract,
          deploymentGas: gasUsed,
          chainId: network.chainId,
          chainName,
          blockNumber: currentBlock,
        };

        console.log(`✅ ${chainName}: Contract deployed at ${contract.address}`);
        console.log(`   Gas used: ${gasUsed.toLocaleString()}`);
        console.log(`   Chain ID: ${network.chainId}`);
        console.log(`   Block: ${currentBlock}`);
      }

      // Verify all deployments
      expect(Object.keys(deployments)).to.have.length(chains.length);
    });

    it("should compare deployment gas costs across chains", function () {
      console.log("\n⛽ Gas Cost Comparison:");
      console.log("====================");

      const gasCosts = Object.entries(deployments).map(([chain, info]) => ({
        chain: chain.padEnd(10),
        gas: info.deploymentGas.toLocaleString().padStart(10),
        chainId: info.chainId.toString().padStart(8),
      }));

      gasCosts.forEach(cost => {
        console.log(`${cost.chain} | ${cost.gas} gas | Chain ID: ${cost.chainId}`);
      });

      // All deployments should have used gas
      Object.values(deployments).forEach(deployment => {
        expect(deployment.deploymentGas).to.be.greaterThan(0);
      });
    });
  });

  describe("Cross-Chain Functionality Testing", function () {
    it("should verify contract information across chains", async function () {
      console.log("\n🔍 Verifying contract information across chains...");

      for (const [chainName, deployment] of Object.entries(deployments)) {
        const chainInfo = await deployment.contract.getChainInfo();

        expect(chainInfo._chainId).to.equal(deployment.chainId);
        expect(chainInfo._name).to.include(chainName.charAt(0).toUpperCase() + chainName.slice(1));

        console.log(`✅ ${chainName}: Chain ID ${chainInfo._chainId}, Name: ${chainInfo._name}`);
      }
    });

    it("should test user registration on all chains", async function () {
      console.log("\n👤 Testing user registration across chains...");

      const userName = "CrossChainTester";

      for (const [chainName, deployment] of Object.entries(deployments)) {
        const provider = getProvider(chainName);
        const signer = deployer.connect(provider);
        const contract = deployment.contract.connect(signer);

        // Register user
        const tx = await contract.registerUser(userName);
        const receipt = await tx.wait();

        // Verify registration
        const userInfo = await contract.getUserInfo(await signer.getAddress());
        expect(userInfo.name).to.equal(userName);
        expect(userInfo.regTime).to.be.greaterThan(0);

        console.log(`✅ ${chainName}: User registered, gas used: ${receipt.gasUsed.toNumber()}`);
      }
    });

    it("should compare gas costs for identical operations", async function () {
      console.log("\n⛽ Comparing operation gas costs...");

      const operationGasCosts: Record<string, number> = {};

      for (const [chainName, deployment] of Object.entries(deployments)) {
        const provider = getProvider(chainName);
        const signer = deployer.connect(provider);
        const contract = deployment.contract.connect(signer);

        // Test computation function
        const tx = await contract.performComputation(100);
        const receipt = await tx.wait();

        operationGasCosts[chainName] = receipt.gasUsed.toNumber();
        console.log(`${chainName}: ${receipt.gasUsed.toNumber()} gas`);
      }

      // Compare costs
      const costs = Object.values(operationGasCosts);
      const minCost = Math.min(...costs);
      const maxCost = Math.max(...costs);

      console.log(`\n💡 Gas cost analysis:`);
      console.log(`   Lowest:  ${minCost.toLocaleString()} gas`);
      console.log(`   Highest: ${maxCost.toLocaleString()} gas`);
      console.log(`   Ratio:   ${(maxCost / minCost).toFixed(2)}x`);

      // All operations should consume gas
      costs.forEach(cost => expect(cost).to.be.greaterThan(0));
    });
  });

  describe("Cross-Chain State Comparison", function () {
    it("should show different block numbers across chains", async function () {
      console.log("\n📊 Cross-chain block comparison:");

      const blockData: Record<
        string,
        { blockNumber: number; timestamp: number | null; chainName: string }
      > = {};

      for (const chainName of chains) {
        const provider = getProvider(chainName);
        const blockNumber = await provider.getBlockNumber();
        const block = await provider.getBlock(blockNumber);

        blockData[chainName] = {
          blockNumber,
          timestamp: block ? block.timestamp : null,
          chainName,
        };
      }

      console.table(blockData);

      // Verify we got valid block data
      Object.values(blockData).forEach(data => {
        expect(data.blockNumber).to.be.a("number");
        expect(data.blockNumber).to.be.greaterThan(0);
      });
    });

    it("should test storage operations across chains", async function () {
      console.log("\n💾 Testing storage operations...");

      const testData = [1, 2, 3, 4, 5];
      const storageGasCosts: Record<string, number> = {};

      for (const [chainName, deployment] of Object.entries(deployments)) {
        const provider = getProvider(chainName);
        const signer = deployer.connect(provider);
        const contract = deployment.contract.connect(signer);

        // Store data
        const tx = await contract.storeData(testData);
        const receipt = await tx.wait();

        storageGasCosts[chainName] = receipt.gasUsed.toNumber();

        // Verify data was stored
        for (let i = 0; i < testData.length; i++) {
          const stored = await contract.userStorage(await signer.getAddress(), i);
          expect(stored).to.equal(testData[i]);
        }

        console.log(`✅ ${chainName}: Storage complete, gas: ${receipt.gasUsed.toNumber()}`);
      }

      console.log("\n📈 Storage gas cost comparison:");
      Object.entries(storageGasCosts).forEach(([chain, cost]) => {
        console.log(`  ${chain.padEnd(10)}: ${cost.toLocaleString()} gas`);
      });
    });
  });

  describe("Network-Specific Behaviors", function () {
    it("should identify chain-specific characteristics", async function () {
      console.log("\n🌐 Chain-specific analysis:");

      for (const chainName of chains) {
        const provider = getProvider(chainName);
        const network = await provider.getNetwork();
        const gasPrice = await provider.getGasPrice();
        const blockNumber = await provider.getBlockNumber();

        console.log(`\n${chainName.toUpperCase()}:`);
        console.log(`  Chain ID: ${network.chainId}`);
        console.log(`  Network Name: ${network.name}`);
        console.log(`  Current Block: ${blockNumber}`);
        console.log(`  Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        // Basic assertions
        expect(network.chainId).to.be.a("number");
        expect(blockNumber).to.be.greaterThan(0);
        expect(gasPrice).to.be.a("object"); // BigNumber
      }
    });
  });
});
