#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// Verify build output and reorganize if needed

const fs = require('fs');
const path = require('path');

const scriptDir = __dirname;
const processorDir = path.resolve(scriptDir, '..');
const distDir = path.resolve(processorDir, 'dist');

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Build may have failed.');
  process.exit(1);
}

// TypeScript may create nested structure: dist/apps/processor/src/
// We need to move files from nested structure to dist/
const nestedSrcDir = path.join(distDir, 'apps', 'processor', 'src');
const nestedIndexPath = path.join(nestedSrcDir, 'index.js');

// Check if nested structure exists
if (fs.existsSync(nestedIndexPath)) {
  console.log('Reorganizing build output from nested structure...');
  
  // Move all files from nested structure to dist/
  const files = fs.readdirSync(nestedSrcDir);
  files.forEach(file => {
    const srcPath = path.join(nestedSrcDir, file);
    const destPath = path.join(distDir, file);
    
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
  
  // Remove nested directories
  const appsDir = path.join(distDir, 'apps');
  if (fs.existsSync(appsDir)) {
    fs.rmSync(appsDir, { recursive: true, force: true });
  }
  
  console.log('✓ Reorganized build output');
}

// Verify that index.js exists in dist
const indexPath = path.join(distDir, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.js does not exist. Build may have failed.');
  process.exit(1);
}

console.log('✓ Build output verified');
console.log(`✓ Output directory: ${distDir}`);
