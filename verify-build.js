#!/usr/bin/env node

/**
 * Build verification script for Supermachine deployment
 * This script checks if the TypeScript build completed successfully
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying MCP Video Recognition build...\n');

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist folder not found!');
  console.error('   The TypeScript build has not completed.');
  console.error('   Run: npm run build');
  process.exit(1);
}

// Check if main entry point exists
const indexPath = path.join(distPath, 'index.js');
if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: dist/index.js not found!');
  console.error('   The build is incomplete.');
  process.exit(1);
}

// Check if all required service files exist
const requiredFiles = [
  'index.js',
  'server.js',
  'services/gemini.js',
  'services/mongodb.js',
  'services/media-downloader.js',
  'tools/image-recognition.js',
  'tools/video-recognition.js',
  'tools/audio-recognition.js'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.error(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.error('\n❌ Build verification FAILED!');
  console.error('   Some required files are missing.');
  console.error('   Try running: npm run build');
  process.exit(1);
}

// Check environment variables
console.log('\n🔍 Checking environment variables...\n');

const requiredEnvVars = ['GOOGLE_API_KEY', 'MONGODB_URI'];
const missingEnvVars = [];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} is set`);
  } else {
    console.error(`❌ ${envVar} is NOT set`);
    missingEnvVars.push(envVar);
  }
}

if (missingEnvVars.length > 0) {
  console.error('\n⚠️  WARNING: Required environment variables are missing!');
  console.error('   The server will fail to start without these.');
} else {
  console.log('\n✅ All environment variables are set');
}

console.log('\n✅ Build verification PASSED!');
console.log('   The MCP is ready to run.');
console.log('   Start with: npm start');