#!/usr/bin/env node

/**
 * Simple Firebase deployment script for pnpm monorepos
 * This builds locally with pnpm (which works) then deploys the built files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Firebase deployment for DOUBLEcheck...\n');

// Step 1: Build with pnpm (this works fine)
console.log('📦 Building application with pnpm...');
try {
  execSync('pnpm build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Build complete!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 2: Check if build output exists
const buildPath = path.join(process.cwd(), 'apps', 'web', '.next');
if (!fs.existsSync(buildPath)) {
  console.error('❌ Build output not found at apps/web/.next');
  process.exit(1);
}

console.log('📤 Build output found, ready to deploy!');
console.log('\n⚠️  Note: Firebase\'s experimental Next.js support has issues with pnpm workspaces.');
console.log('Consider using Cloud Run or Vercel for better Next.js monorepo support.\n');

// Step 3: Deploy Firestore/Storage rules only (not hosting)
console.log('📤 Deploying Firestore and Storage rules...');
try {
  execSync('firebase deploy --only firestore,storage', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Rules deployed!\n');
} catch (error) {
  console.error('⚠️  Rules deployment had issues:', error.message);
}

console.log('\n⚠️  HOSTING DEPLOYMENT:');
console.log('Due to pnpm workspace incompatibility, hosting deployment requires Cloud Run.');
console.log('See DEPLOYMENT.md for Cloud Run instructions, or use:');
console.log('  npm run deploy:cloudrun\n');

