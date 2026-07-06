# @diamondslab/hardhat-multichain

[![npm version](https://img.shields.io/npm/v/@diamondslab/hardhat-multichain.svg)](https://www.npmjs.com/package/@diamondslab/hardhat-multichain)
[![Build Status](https://github.com/DiamondsLab/hardhat-multichain/workflows/CI/badge.svg)](https://github.com/DiamondsLab/hardhat-multichain/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A professional Hardhat plugin for launching and managing multiple forked blockchain networks simultaneously. Perfect for cross-chain development, testing, and multi-network deployments.

## Migrating from `hardhat-multichain`

This package was previously published as the unscoped `hardhat-multichain` (latest: `1.0.6`). Starting with **v1.1.0** it is published as **`@diamondslab/hardhat-multichain`**. The unscoped package is **deprecated** and will receive **no further releases**.

To migrate:

```bash
# npm
npm uninstall hardhat-multichain && npm install @diamondslab/hardhat-multichain

# yarn
yarn remove hardhat-multichain && yarn add @diamondslab/hardhat-multichain
```

Then update the plugin import in your `hardhat.config.ts`:

```diff
-import "hardhat-multichain";
+import "@diamondslab/hardhat-multichain";
```

And any deep or named imports:

```diff
-import { getProvider, multichain } from "hardhat-multichain";
-import ChainManager from "hardhat-multichain/dist/src/chainManager";
+import { getProvider, multichain } from "@diamondslab/hardhat-multichain";
+import ChainManager from "@diamondslab/hardhat-multichain/dist/chainManager";
```

Note: the compiled output is now flat under `dist/` (no `dist/src/`), and the package defines an `exports` map (`.`, `./dist/*`, `./package.json`). See [CHANGELOG.md](CHANGELOG.md) for the full list of packaging changes in 1.1.0.

## 🚀 Features

- **Multi-Network Forking**: Launch multiple blockchain forks simultaneously
- **Network Management**: Easy switching between different networks
- **Provider Management**: Unified provider interface for all networks
- **Configuration Flexibility**: Support for environment variables and config files
- **Logging & Monitoring**: Comprehensive logging with chain status tracking
- **Error Handling**: Robust error handling with detailed error messages
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Testing Integration**: Seamless integration with Hardhat testing framework

## 📋 Prerequisites

- **Node.js ≥ 18** (Node 16 is end-of-life and no longer supported)
- **Yarn ≥ 4** (for developing this package; consumers may use any package manager)
- Hardhat `^2.22.1` and ethers `^6.0.0` as peer dependencies

## 📦 Installation

```bash
npm install @diamondslab/hardhat-multichain
```

Or with Yarn:

```bash
yarn add @diamondslab/hardhat-multichain
```

## 🛠️ Setup

### 1. Import the plugin in your `hardhat.config.ts`

```typescript
import "@diamondslab/hardhat-multichain";

const config: HardhatUserConfig = {
  // Your existing config...
  chainManager: {
    chains: {
      ethereum: {
        rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
        chainId: 1,
        blockNumber: 18500000 // Optional: Fork from specific block
      },
      polygon: {
        rpcUrl: "https://polygon-rpc.com",
        chainId: 137,
        blockNumber: 50000000
      },
      arbitrum: {
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        chainId: 42161
      }
    }
  }
};

export default config;
```

### 2. Environment Variables (Alternative Configuration)

Create a `.env` file in your project root:

```env
ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
ETHEREUM_BLOCK=18500000
POLYGON_RPC=https://polygon-rpc.com
POLYGON_BLOCK=50000000
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
```

## 📖 Usage

### Basic Usage

Launch multiple networks and run tests:

```bash
npx hardhat test-multichain --chains ethereum,polygon,arbitrum
```

### With Specific Test Files

```bash
npx hardhat test-multichain --chains ethereum,polygon --testFiles test/crosschain.test.ts
```

### With Custom Logging

```bash
npx hardhat test-multichain --chains ethereum,polygon --logs ./logs
```

### Programmatic Usage

```typescript
import { getProvider, getMultichainProviders } from "@diamondslab/hardhat-multichain";
import ChainManager from "@diamondslab/hardhat-multichain/dist/chainManager";

// Get a specific provider
const ethereumProvider = getProvider("ethereum");
const blockNumber = await ethereumProvider.getBlockNumber();

// Get all providers
const providers = getMultichainProviders();

// Setup chains programmatically
await ChainManager.setupChains(["ethereum", "polygon"], hre.userConfig);

// Check chain status
const status = ChainManager.getChainStatus("ethereum");
console.log(`Ethereum chain status: ${status}`);

// Cleanup when done
await ChainManager.cleanup();
```

### Advanced Testing Example

```typescript
import { expect } from "chai";
import { getProvider } from "@diamondslab/hardhat-multichain";

describe("Cross-chain Contract Tests", function () {
  let ethereumProvider: JsonRpcProvider;
  let polygonProvider: JsonRpcProvider;

  before(async function () {
    // Providers are automatically available after test-multichain task
    ethereumProvider = getProvider("ethereum");
    polygonProvider = getProvider("polygon");
  });

  it("should deploy contract on multiple chains", async function () {
    // Deploy to Ethereum
    const ethereumFactory = new ethers.ContractFactory(abi, bytecode, ethereumProvider.getSigner());
    const ethereumContract = await ethereumFactory.deploy();

    // Deploy to Polygon
    const polygonFactory = new ethers.ContractFactory(abi, bytecode, polygonProvider.getSigner());
    const polygonContract = await polygonFactory.deploy();

    expect(ethereumContract.address).to.be.properAddress;
    expect(polygonContract.address).to.be.properAddress;
  });
});
```

## ⚙️ Configuration Options

### Chain Configuration

```typescript
interface ChainConfig {
  rpcUrl: string;        // Required: RPC endpoint URL
  chainId?: number;      // Optional: Chain ID (default: 31337)
  blockNumber?: number;  // Optional: Block number to fork from
}
```

### Task Parameters

- `--chains`: Comma-separated list of chain names to fork
- `--logs`: Directory for storing chain logs (optional)
- `testFiles`: Specific test files to run (optional)

## 🔧 API Reference

### ChainManager

The core class for managing blockchain networks.

#### Static Methods

- `setupChains(chains: string[], config: HardhatUserConfig, logsDir?: string): Promise<MultiChainProviders>`
- `getProvider(chainName: string): JsonRpcProvider | undefined`
- `getProviders(): MultiChainProviders`
- `getChainStatus(chainName: string): 'running' | 'stopped' | 'error' | 'unknown'`
- `getChainStatusDetails(chainName: string): ChainStatus | undefined`
- `getAllChainStatuses(): Map<string, ChainStatus>`
- `validateNetwork(url: string, timeout?: number): Promise<boolean>`
- `cleanup(): Promise<void>`

### Utility Functions

- `getProvider(networkName: string): JsonRpcProvider`
- `getMultichainProviders(): MultiChainProviders`

### Error Classes

- `ChainConfigError`: Configuration-related errors
- `NetworkConnectionError`: Network connectivity issues
- `ProcessCleanupError`: Process cleanup failures

## 🚨 Error Handling

The plugin includes comprehensive error handling:

```typescript
import { ChainConfigError, NetworkConnectionError } from "@diamondslab/hardhat-multichain";

try {
  await ChainManager.setupChains(["ethereum"], config);
} catch (error) {
  if (error instanceof ChainConfigError) {
    console.error("Configuration issue:", error.message);
  } else if (error instanceof NetworkConnectionError) {
    console.error("Network connectivity issue:", error.message);
  }
}
```

## 📊 Monitoring & Logging

### Chain Status Monitoring

```typescript
// Get detailed status for a specific chain
const status = ChainManager.getChainStatusDetails("ethereum");
console.log(status);
// Output: { name: "ethereum", status: "running", port: 8547, rpcUrl: "...", ... }

// Get status for all chains
const allStatuses = ChainManager.getAllChainStatuses();
allStatuses.forEach((status, chainName) => {
  console.log(`${chainName}: ${status.status}`);
});
```

### Custom Logging

Logs are automatically generated when using the `--logs` parameter:

```bash
npx hardhat test-multichain --chains ethereum,polygon --logs ./logs
```

This creates separate log files for each chain:

- `./logs/ethereum-node.log`
- `./logs/polygon-node.log`

## 🧪 Testing & Development

This project maintains high code quality standards with comprehensive testing and coverage reporting.

> **Installing from a git URL?** As of 1.1.0 the built `dist/` output is no longer committed to git. Git-URL installs must build the package (`yarn install && yarn build`); installs from the npm registry tarball are unaffected.

### Test Suite

The project includes a robust test suite with **53 test cases** covering:

- **Chain Manager Core Functionality**: Network setup, provider management, validation
- **Error Handling**: Configuration errors, network failures, cleanup scenarios
- **Configuration Validation**: Parameter checking, environment variable handling
- **Process Management**: Fork lifecycle, port management, resource cleanup
- **Provider Interface**: Network switching, status monitoring, connection management

### Running Tests

```bash
# Run all tests
yarn test

# Run tests with coverage report
yarn test:coverage

# Run tests in watch mode
yarn test:watch
```

### Development Scripts

```bash
# Development workflow
yarn build          # Compile TypeScript
yarn test           # Run test suite (jest)
yarn test:coverage  # Generate coverage report
yarn lint           # Check code style
yarn lint:fix       # Fix linting issues
yarn format         # Format code with Prettier
yarn format:check   # Check code formatting
```

### Testing Framework

The project uses Jest with TypeScript support:

- **Jest**: Modern testing framework with parallel execution
- **ts-jest**: TypeScript transpilation for Jest
- **Coverage Reporting**: Comprehensive coverage metrics with detailed reports
- **Test Organization**: Well-structured test suites with descriptive test names

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `yarn install`
3. Build the project: `yarn build`
4. Run tests: `yarn test`
5. Generate coverage: `yarn test:coverage`
6. Run linting: `yarn lint`

### Quality Standards

We maintain high quality standards:

- **Test Coverage**: Minimum 75% statement coverage
- **Code Style**: ESLint with TypeScript rules
- **Documentation**: Comprehensive README and inline comments
- **Type Safety**: Full TypeScript support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Hardhat](https://hardhat.org) for the excellent development framework
- [Ethers.js](https://docs.ethers.io/) for blockchain interactions
- The Ethereum community for continuous innovation

## 🐛 Troubleshooting

### Common Issues

#### Network Connection Timeouts

```bash
Error: Failed to connect to network at http://localhost:8547
```

**Solution**: Check your RPC URLs and ensure they're accessible. Increase timeout if needed.

#### Port Already in Use

```bash
Error: Port 8547 is already in use
```

**Solution**: The plugin automatically increments ports, but you may need to close other Hardhat instances.

#### Missing RPC Configuration

```bash
Error: Missing required rpcUrl for ethereum
```

**Solution**: Ensure your `hardhat.config.ts` includes the chain configuration or set environment variables.

### Getting Help

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/DiamondsLab/hardhat-multichain/issues)
- 💬 [Discussions](https://github.com/DiamondsLab/hardhat-multichain/discussions)

#### Parameters

- `--chains` (comma-separated list): Specifies the networks to fork (e.g., `sepolia,amoy`).

Example:

```bash
npx hardhat test-multichain --chains "sepolia,amoy"
```

#### Additional Parameters

- `--logs` (string): Specifies the directory to save the logs for each network.

No logs are saved by default. The logs are output to console.

Example:

```bash
npx hardhat test-multichain --chains "sepolia,amoy" --logs logs
```

## Environment Extensions

This plugin extends the Hardhat Runtime Environment (HRE) with:

- `hre.changeNetwork(networkName: string)`: Changes the active network in the Hardhat runtime.
- `hre.getProvider(networkName: string): JsonRpcProvider`: Retrieves the provider for a given network.

## Configuration

This plugin extends the Hardhat User Configuration by adding `chainManager` support.

There are three fields that can be configured for each chain:

Chain RPC URL, a [Mock Chain ID](#mock-chain-id), and Block Number.  By defining the block number, you can specify the block at which the chain should fork and this will then be cached, as this is the behavior for Hardhat.

Example `hardhat.config.ts`:

```ts
const config = {
  ...
  chainManager: {
    chains: {
      sepolia: { rpcUrl: "https://rpc.sepolia.io", chainId: 11155111, blockNumber: 12345678 },
      amoy: { rpcUrl: "https://rpc.amoy.io", chainId: 80002, blockNumber: 12345678 },
    },
  },
  ...
};
```

### Mock Chain ID

The use of a Mock Chain ID is to allow for the use of the different chain IDs for the forks for easier identification but generally aren't required.

It requires the following configuration in the `hardhat.config.ts` file:

```ts
const config = {
  ...
    // Configuration for different networks
    networks: {
      // Hardhat's built-in local blockchain network
      hardhat: {
        chainId: MOCK_CHAIN_ID, // Sets the chain ID for the Hardhat network
        ...
      },
  };
  ...
}
```

### .env configuration

You can also configure the plugin using environment variables:

```bash
SEPOLIA_RPC=https://rpc.sepolia.io
SEPOLIA_CHAIN_ID=11155111
SEPOLIA_BLOCK=12345678
```

### Note on "Unknown" Blockchains

If you are using a blockchain that is not recognized by Hardhat (including Amoy), you will need to define the hardfork history in the `hardhat.config.ts` file. This is because Hardhat does not have a built-in hardfork history for these blockchains.

Example:

```ts
  // Configuration for different networks
  networks: {
    // Hardhat's built-in local blockchain network
    hardhat: {
      ...
      // Sets the Amoy hardfork history which is required for hardhat "unknown" networks
      80002: {
        hardforkHistory: {
          london: 10000000,
        }
      },
    },
  },
```

## Code Examples

### Using available Networks

You can change the active Ethers provider in a test by using the `getProvider(<chain-name>)` function:

```ts
ethers.provider = hre.getProvider("sepolia");
```

This only changes the Ethers provider within the current scope.

### Looping through Networks

See [test/integration/README.md](test/integration/README.md) for a complete example of looping tests over each configured network.
