#!/usr/bin/env node

// Simple test to verify the package structure is correct
const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying package structure for git/npm installation...\n');

// Check package.json 
const packageJson = require('./package.json');
console.log('✓ Package name:', packageJson.name);
console.log('✓ Package version:', packageJson.version);
console.log('✓ Main entry point:', packageJson.main);
console.log('✓ Types entry point:', packageJson.types);

// Check if main file exists
const mainFile = path.resolve(packageJson.main);
if (fs.existsSync(mainFile)) {
  console.log('✓ Main file exists:', mainFile);
} else {
  console.log('✗ Main file missing:', mainFile);
}

// Check if types file exists
const typesFile = path.resolve(packageJson.types);
if (fs.existsSync(typesFile)) {
  console.log('✓ Types file exists:', typesFile);
} else {
  console.log('✗ Types file missing:', typesFile);
}

// Check dist folder structure
const distFiles = fs.readdirSync('./dist');
console.log('✓ Dist folder contains:', distFiles.join(', '));

// Check if all TypeScript files have corresponding .d.ts files
const tsFiles = distFiles.filter(f => f.endsWith('.js') && !f.endsWith('.d.ts'));
console.log('\n📋 Checking TypeScript declaration files:');
tsFiles.forEach(jsFile => {
  const dtsFile = jsFile.replace('.js', '.d.ts');
  if (distFiles.includes(dtsFile)) {
    console.log('✓', jsFile, '->', dtsFile);
  } else {
    console.log('✗', jsFile, '-> missing', dtsFile);
  }
});

// Check files listed in package.json
console.log('\n📦 Checking files array in package.json:');
packageJson.files.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✓', file);
  } else {
    console.log('✗', file, '(missing)');
  }
});

console.log('\n🚀 Package structure verification complete!');
console.log('\nThe package is now ready for:');
console.log('  • npm install hardhat-multichain');
console.log('  • yarn add hardhat-multichain');
console.log('  • npm install git+https://github.com/GeniusVentures/hardhat-multichain.git');
console.log('  • yarn add git+https://github.com/GeniusVentures/hardhat-multichain.git');
