#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// Compile Prisma TypeScript files to JavaScript for ES module compatibility

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '../../..');
const prismaDir = path.join(projectRoot, 'generated/prisma');

if (!fs.existsSync(prismaDir)) {
  console.error('Error: Prisma generated directory not found. Run: npx prisma generate');
  process.exit(1);
}

console.log('Compiling Prisma TypeScript files to JavaScript...');

// Find all .ts files (excluding .d.ts)
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.d.ts.map')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const tsFiles = findTsFiles(prismaDir);
let compiled = 0;
let failed = 0;

tsFiles.forEach(tsFile => {
  const relativePath = path.relative(projectRoot, tsFile);
  const jsFile = tsFile.replace(/\.ts$/, '.js');
  
  // Skip if .js already exists and is newer
  if (fs.existsSync(jsFile)) {
    const tsStat = fs.statSync(tsFile);
    const jsStat = fs.statSync(jsFile);
    if (jsStat.mtime >= tsStat.mtime) {
      return; // Already compiled and up to date
    }
  }
  
  try {
    // Compile single file
    execSync(
      `npx tsc "${tsFile}" --outDir "${path.dirname(tsFile)}" --module ES2022 --target ES2022 --moduleResolution node --esModuleInterop --skipLibCheck --declaration false --sourceMap false --isolatedModules`,
      { cwd: projectRoot, stdio: 'pipe' }
    );
    compiled++;
  } catch (error) {
    // Some files might fail (like browser.ts), that's okay
    failed++;
  }
});

// Patch all .js files to add .js extensions to relative imports
function patchJsFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Add .js to relative imports that don't have extensions
  content = content.replace(
    /from\s+["'](\.\/[^"']+?)(?<!\.js)(?<!\.ts)["']/g,
    (match, importPath) => {
      if (importPath.startsWith('./') && !importPath.endsWith('.js') && !importPath.endsWith('.ts')) {
        return match.replace(importPath, importPath + '.js');
      }
      return match;
    }
  );
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Patch all generated .js files
const jsFiles = findTsFiles(prismaDir).map(f => f.replace(/\.ts$/, '.js')).filter(f => fs.existsSync(f));
let patched = 0;
jsFiles.forEach(jsFile => {
  if (patchJsFile(jsFile)) {
    patched++;
  }
});

if (compiled > 0 || patched > 0) {
  console.log(`✓ Compiled ${compiled} files, patched ${patched} files for ES module compatibility`);
} else {
  console.log('✓ Prisma files already compiled and up to date');
}

if (failed > 0) {
  console.log(`⚠ ${failed} files skipped (may be browser-only or not needed)`);
}
