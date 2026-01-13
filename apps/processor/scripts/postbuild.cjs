#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// This is a CommonJS file (.cjs), so require() is the correct syntax

const fs = require('fs');
const path = require('path');

// Use absolute paths to avoid issues with current working directory
const scriptDir = __dirname;
const processorDir = path.resolve(scriptDir, '..');
const distDir = path.resolve(processorDir, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Build may have failed.');
  process.exit(1);
}

// Verify that index.js exists in dist
const indexPath = path.join(distDir, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.js does not exist. Build may have failed.');
  process.exit(1);
}

console.log('✓ Build output verified');
console.log(`✓ Output directory: ${distDir}`);
