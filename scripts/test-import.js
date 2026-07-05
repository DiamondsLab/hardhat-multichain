// Test script to verify the package structure
const fs = require('fs');
const path = require('path');

console.log('📦 Testing package structure...');

// Check if main entry point exists
const mainFile = './dist/src/index.js';
if (fs.existsSync(mainFile)) {
  console.log('✅ Main entry point exists:', mainFile);
} else {
  console.error('❌ Main entry point missing:', mainFile);
  process.exit(1);
}

// Check if types exist
const typesFile = './dist/src/index.d.ts';
if (fs.existsSync(typesFile)) {
  console.log('✅ Type definitions exist:', typesFile);
} else {
  console.error('❌ Type definitions missing:', typesFile);
  process.exit(1);
}

// Check if tsconfig.json exists
const tsconfigFile = './tsconfig.json';
if (fs.existsSync(tsconfigFile)) {
  console.log('✅ tsconfig.json exists:', tsconfigFile);
} else {
  console.error('❌ tsconfig.json missing:', tsconfigFile);
  process.exit(1);
}

// Check package.json configuration
const packageJson = require('./package.json');
console.log('✅ Package name:', packageJson.name);
console.log('✅ Package version:', packageJson.version);
console.log('✅ Main entry:', packageJson.main);
console.log('✅ Types entry:', packageJson.types);

// Check if all files in package.json files array exist
packageJson.files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅ Package file exists:', file);
  } else {
    console.error('❌ Package file missing:', file);
  }
});

console.log('\n✅ Package structure validation complete!');
