# Hardhat Multichain Integration Examples

This directory contains examples and integration tests demonstrating how to use the `@diamondslab/hardhat-multichain` plugin in your projects.

## Quick Start

1. **Install the plugin:**

```bash
npm install @diamondslab/hardhat-multichain
```

2. **Configure your `.env` file:**

```env
MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/your-api-key
SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/your-api-key
MAINNET_BLOCK=21861043
SEPOLIA_BLOCK=7590462
MAINNET_MOCK_CHAIN_ID=11111169
SEPOLIA_MOCK_CHAIN_ID=11169111
```

3. **Update your `hardhat.config.ts`:**

```typescript
import * as dotenv from 'dotenv';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@diamondslab/hardhat-multichain';

dotenv.config();

const {
  MAINNET_RPC,
  SEPOLIA_RPC,
  MAINNET_BLOCK,
  SEPOLIA_BLOCK,
  MAINNET_MOCK_CHAIN_ID,
  SEPOLIA_MOCK_CHAIN_ID
} = process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  chainManager: {
    chains: {
      mainnet: {
        rpcUrl: MAINNET_RPC || '',
        blockNumber: MAINNET_BLOCK ? parseInt(MAINNET_BLOCK) : undefined,
        chainId: MAINNET_MOCK_CHAIN_ID ? parseInt(MAINNET_MOCK_CHAIN_ID) : 11111169
      },
      sepolia: {
        rpcUrl: SEPOLIA_RPC || '',
        blockNumber: SEPOLIA_BLOCK ? parseInt(SEPOLIA_BLOCK) : undefined,
        chainId: SEPOLIA_MOCK_CHAIN_ID ? parseInt(SEPOLIA_MOCK_CHAIN_ID) : 11169111
      }
    }
  }
};

export default config;
```

4. **Write your tests:**

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { multichain } from '@diamondslab/hardhat-multichain';

describe('NFT Factory Tests', function () {
  // Get network providers based on command line args
  let networkProviders = multichain.getProviders() || new Map();

  // Handle command line arguments from test-multichain
  if (process.argv.includes('test-multichain')) {
    const networkNames = process.argv[process.argv.indexOf('--chains') + 1].split(',');
    if (networkNames.includes('hardhat')) {
      networkProviders.set('hardhat', ethers.provider);
    }
  } else if (process.argv.includes('test') || process.argv.includes('coverage')) {
    networkProviders.set('hardhat', ethers.provider);
  }

  // Loop through each network
  for (const [networkName, provider] of networkProviders.entries()) {
    describe(`🔗 Chain: ${networkName}`, function () {
      it('should deploy NFT contract', async function () {
        console.log(`Testing NFT deployment on ${networkName}...`);
        
        const blockNumber = await provider.getBlockNumber();
        const network = await provider.getNetwork();
        
        expect(blockNumber).to.be.greaterThan(0);
        expect(network.chainId).to.be.greaterThan(0);
        
        // Your contract deployment logic here
        // const factory = await ethers.getContractFactory("NFTFactory");
        // const contract = await factory.deploy();
        // await contract.deployed();
        
        console.log(`✅ NFT deployment successful on ${networkName}@${blockNumber}`);
      });

      it('should mint NFT', async function () {
        console.log(`Testing NFT minting on ${networkName}...`);
        
        // Your minting logic here
        const blockNumber = await provider.getBlockNumber();
        expect(blockNumber).to.be.greaterThan(0);
        
        console.log(`✅ NFT minting successful on ${networkName}`);
      });
    });
  }
});
```

5. **Run your tests:**

```bash
# Test on single chain
npx hardhat test-multichain --chains mainnet test/NFTFactory.test.ts

# Test on multiple chains
npx hardhat test-multichain --chains mainnet,sepolia test/NFTFactory.test.ts

# Test all files on multiple chains
npx hardhat test-multichain --chains mainnet,sepolia
```

## Advanced Usage

### Custom Chain Configuration

```typescript
// hardhat.config.ts
export default {
  chainManager: {
    chains: {
      polygon: {
        rpcUrl: process.env.POLYGON_RPC || '',
        blockNumber: parseInt(process.env.POLYGON_BLOCK || '0'),
        chainId: 137
      },
      arbitrum: {
        rpcUrl: process.env.ARBITRUM_RPC || '',
        blockNumber: parseInt(process.env.ARBITRUM_BLOCK || '0'),
        chainId: 42161
      },
      optimism: {
        rpcUrl: process.env.OPTIMISM_RPC || '',
        blockNumber: parseInt(process.env.OPTIMISM_BLOCK || '0'),
        chainId: 10
      }
    }
  }
};
```

### Cross-Chain Tests

```typescript
describe('Cross-Chain Functionality', function () {
  it('should work across all configured chains', async function () {
    const networkProviders = multichain.getProviders();
    const results = [];
    
    for (const [networkName, provider] of networkProviders.entries()) {
      const blockNumber = await provider.getBlockNumber();
      const network = await provider.getNetwork();
      
      results.push({
        network: networkName,
        blockNumber: blockNumber,
        chainId: Number(network.chainId)
      });
    }
    
    expect(results.length).to.be.greaterThan(0);
    console.log('Cross-chain test results:', results);
  });
});
```

### Error Handling

```typescript
describe('Error Handling', function () {
  it('should handle network failures gracefully', async function () {
    const networkProviders = multichain.getProviders();
    
    for (const [networkName, provider] of networkProviders.entries()) {
      try {
        await provider.getBlockNumber();
        console.log(`✅ ${networkName} is accessible`);
      } catch (error) {
        console.log(`❌ ${networkName} failed: ${error.message}`);
        // Handle network-specific failures
      }
    }
  });
});
```

## Examples in this Directory

- `usage-demonstration.test.ts` - Basic usage patterns and configuration
- `hardhat-task-integration.test.ts` - Integration with Hardhat tasks
- `multichain-pattern.test.ts` - Advanced multichain patterns
- `example-usage.test.ts` - Complete example of how consuming projects would use the plugin

## Running the Examples

```bash
# Run all integration tests
yarn test test/integration/

# Run specific example
yarn test test/integration/usage-demonstration.test.ts

# Test with actual hardhat task
yarn test test/integration/hardhat-task-integration.test.ts
```

## Best Practices

1. **Pin Block Numbers:** Use specific block numbers for consistent test results
2. **Environment Variables:** Store RPC URLs and sensitive data in `.env` files
3. **Error Handling:** Always handle network failures gracefully
4. **Test Isolation:** Clean up resources after each test
5. **Command Line Args:** Support both `test-multichain` and regular `test` commands

## Troubleshooting

- **Timeout Issues:** Increase Jest timeout for network operations
- **RPC Limits:** Use your own RPC endpoints, not public ones
- **Port Conflicts:** Plugin automatically assigns ports starting from 8546
- **Process Cleanup:** Plugin automatically cleans up forked processes

For more examples and documentation, see the main README.md file.
