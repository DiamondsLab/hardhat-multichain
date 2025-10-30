// Test setup file
// This file is executed before each test file

import ChainManager from "../src/chainManager";

// Handle unhandled promise rejections in tests
process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error);
});

// Global cleanup after all tests
afterAll(async () => {
  try {
    await ChainManager.cleanup();
  } catch {
    // Ignore cleanup errors
  }
});

export {};
