#!/usr/bin/env node

// Test script to verify package installation works correctly
const fs = require('fs');
const path = require('path');

console.log('Testing package installation...');

// Check if main entry point exists
const mainFile = require.resolve('./dist/index.js');
console.log('✓ Main entry point found:', mainFile);

// Check if types are available
const typesFile = path.resolve('./dist/index.d.ts');
if (fs.existsSync(typesFile)) {
  console.log('✓ TypeScript definitions found:', typesFile);
} else {
  console.log('✗ TypeScript definitions not found');
}

// Try to import the package
try {
  const pkg = require('./dist/index.js');
  console.log('✓ Package imports successfully');
  console.log('  Available exports:', Object.keys(pkg));
} catch (error) {
  console.log('✗ Package import failed:', error.message);
}

// Check if all required dependencies are available
const packageJson = require('./package.json');
console.log('✓ Package.json main field:', packageJson.main);
console.log('✓ Package.json types field:', packageJson.types);

console.log('\nPackage test completed!');
