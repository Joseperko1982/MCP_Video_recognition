#!/usr/bin/env node

/**
 * Deployment verification script for Supermachine
 * Run this before deploying to catch common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const errors = [];
const warnings = [];

console.log('🔍 Verifying deployment readiness...\n');

// Check Node version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion < 18) {
  errors.push(`Node.js version ${nodeVersion} is too old. Required: >=18.0.0`);
} else {
  console.log(`✅ Node.js version: ${nodeVersion}`);
}

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  errors.push('dist folder not found. Run "npm run build" first');
} else {
  console.log('✅ Build output (dist) found');
}

// Check package.json
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  // Check for type: module
  if (packageJson.type !== 'module') {
    errors.push('package.json must have "type": "module"');
  } else {
    console.log('✅ ES modules configured');
  }
  
  // Check for required dependencies
  const requiredDeps = [
    '@google/genai',
    '@modelcontextprotocol/sdk',
    'mongodb',
    'dotenv',
    'typescript'
  ];
  
  const dependencies = packageJson.dependencies || {};
  const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
  
  if (missingDeps.length > 0) {
    errors.push(`Missing required dependencies: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All required dependencies present');
  }
  
  // Check if TypeScript is in dependencies (not devDependencies)
  if (packageJson.devDependencies?.typescript) {
    warnings.push('TypeScript should be in dependencies, not devDependencies for Supermachine');
  }
  
} catch (error) {
  errors.push(`Failed to read package.json: ${error.message}`);
}

// Check tsconfig.json
try {
  const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8'));
  
  if (tsConfig.compilerOptions?.module !== 'ESNext') {
    warnings.push('tsconfig.json should use "module": "ESNext"');
  }
  
  console.log('✅ TypeScript configuration found');
} catch (error) {
  errors.push(`Failed to read tsconfig.json: ${error.message}`);
}

// Check .env.example
if (!fs.existsSync(path.join(__dirname, '.env.example'))) {
  warnings.push('.env.example not found - users won't know what environment variables are needed');
} else {
  console.log('✅ Environment template (.env.example) found');
}

// Check for .env (should NOT exist in repo)
if (fs.existsSync(path.join(__dirname, '.env'))) {
  errors.push('.env file found! Remove it before deploying (contains secrets)');
}

// Check main entry file
const mainFile = path.join(distPath, 'index.js');
if (fs.existsSync(distPath) && !fs.existsSync(mainFile)) {
  errors.push('dist/index.js not found after build');
} else if (fs.existsSync(mainFile)) {
  // Check if dotenv is imported
  const content = fs.readFileSync(mainFile, 'utf8');
  if (!content.includes('dotenv')) {
    warnings.push('dotenv might not be imported in index.js');
  }
  console.log('✅ Main entry point found');
}

// Display results
console.log('\n📊 Verification Results:\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 Everything looks good! Ready for deployment.');
} else {
  if (errors.length > 0) {
    console.log('❌ ERRORS (must fix):');
    errors.forEach(err => console.log(`   - ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (should fix):');
    warnings.forEach(warn => console.log(`   - ${warn}`));
  }
  
  console.log('\n💡 Run these commands to fix most issues:');
  console.log('   npm install');
  console.log('   npm run build');
  
  process.exit(errors.length > 0 ? 1 : 0);
}

// Test environment variables
console.log('\n🔐 Testing environment variables...');
const requiredEnvVars = ['GOOGLE_API_KEY', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.log('   These must be set in Supermachine dashboard');
} else {
  console.log('✅ All required environment variables are set');
}

console.log('\n📝 Deployment checklist:');
console.log('   1. Set environment variables in Supermachine');
console.log('   2. Ensure MongoDB Atlas allows connections from all IPs (0.0.0.0/0)');
console.log('   3. Use this repository URL in Supermachine');
console.log('   4. Supermachine will run: npm install && npm run build && npm start');
console.log('\n✨ Good luck with your deployment!');