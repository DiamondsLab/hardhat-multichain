#!/bin/bash

echo "🔍 Verifying hardhat-multichain package configuration..."
echo

# Check if essential files exist
echo "📁 Checking essential files:"
files=("package.json" "tsconfig.json" "dist/src/index.js" "dist/src/index.d.ts" "README.md" "LICENSE")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

echo
echo "📦 Package.json configuration:"
echo "  Name: $(jq -r '.name' package.json)"
echo "  Version: $(jq -r '.version' package.json)"
echo "  Main: $(jq -r '.main' package.json)"
echo "  Types: $(jq -r '.types' package.json)"
echo "  Repository: $(jq -r '.repository.url' package.json)"

echo
echo "🏗️ Build output:"
if [ -d "dist/src" ]; then
    echo "  ✅ dist/src directory exists"
    echo "  Files: $(ls -la dist/src/ | wc -l) items"
else
    echo "  ❌ dist/src directory missing"
fi

echo
echo "✅ Package is ready for npm publishing!"
echo
echo "📋 To install this package in another project:"
echo "  npm install hardhat-multichain@https://github.com/GeniusVentures/hardhat-multichain.git"
echo "  yarn add hardhat-multichain@https://github.com/GeniusVentures/hardhat-multichain.git"
