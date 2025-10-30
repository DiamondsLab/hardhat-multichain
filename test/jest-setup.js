// Set NODE_ENV to test to suppress non-essential logging during tests
process.env.NODE_ENV = 'test';

// Set up test environment variables for integration tests
// These are mock values for testing purposes only
process.env.MAINNET_RPC = process.env.MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/test-api-key';
process.env.SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/test-api-key';
process.env.MAINNET_BLOCK = process.env.MAINNET_BLOCK || '19000000';
process.env.SEPOLIA_BLOCK = process.env.SEPOLIA_BLOCK || '5000000';
process.env.MAINNET_MOCK_CHAIN_ID = process.env.MAINNET_MOCK_CHAIN_ID || '11111169';
process.env.SEPOLIA_MOCK_CHAIN_ID = process.env.SEPOLIA_MOCK_CHAIN_ID || '11169111';
