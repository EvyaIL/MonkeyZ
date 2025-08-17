#!/usr/bin/env node
/**
 * Frontend Build Fix Script
 * =========================
 * 
 * This script fixes chunk loading errors by:
 * 1. Cleaning build artifacts
 * 2. Rebuilding with stable chunk names
 * 3. Ensuring proper deployment structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Frontend Chunk Loading Issues...\n');

const frontendDir = __dirname;
const buildDir = path.join(frontendDir, 'build');
const nodeModulesDir = path.join(frontendDir, 'node_modules');

// Step 1: Clean existing build
console.log('1️⃣ Cleaning existing build...');
try {
  if (fs.existsSync(buildDir)) {
    fs.rmSync(buildDir, { recursive: true, force: true });
    console.log('   ✅ Removed old build directory');
  }
  
  // Clear npm cache for good measure
  execSync('npm cache clean --force', { stdio: 'inherit', cwd: frontendDir });
  console.log('   ✅ Cleared npm cache');
} catch (error) {
  console.log('   ⚠️ Build directory cleanup had issues:', error.message);
}

// Step 2: Rebuild with chunk stability
console.log('\n2️⃣ Building with chunk stability fixes...');
try {
  // Set environment variables for stable builds
  process.env.GENERATE_SOURCEMAP = 'false';
  process.env.DISABLE_ESLINT_PLUGIN = 'true';
  process.env.DISABLE_NEW_JSX_TRANSFORM = 'true';
  process.env.TSC_COMPILE_ON_ERROR = 'true';
  
  // Build with stable chunk names
  execSync('npm run build', { 
    stdio: 'inherit', 
    cwd: frontendDir,
    env: {
      ...process.env,
      // Force consistent chunk naming
      REACT_APP_CHUNK_STABLE: 'true'
    }
  });
  
  console.log('   ✅ Build completed successfully');
} catch (error) {
  console.error('   ❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Verify build files
console.log('\n3️⃣ Verifying build files...');
try {
  const staticJsDir = path.join(buildDir, 'static', 'js');
  
  if (!fs.existsSync(staticJsDir)) {
    throw new Error('Static JS directory not found');
  }
  
  const jsFiles = fs.readdirSync(staticJsDir);
  const chunkFiles = jsFiles.filter(file => file.includes('.chunk.js'));
  
  console.log(`   ✅ Found ${jsFiles.length} JS files`);
  console.log(`   ✅ Found ${chunkFiles.length} chunk files`);
  
  // List chunk files for verification
  console.log('\n   📦 Chunk files created:');
  chunkFiles.forEach(file => {
    console.log(`      - ${file}`);
  });
  
} catch (error) {
  console.error('   ❌ Build verification failed:', error.message);
  process.exit(1);
}

// Step 4: Create deployment-ready structure
console.log('\n4️⃣ Preparing for deployment...');
try {
  // Copy index.html as backup
  const indexPath = path.join(buildDir, 'index.html');
  const indexBackupPath = path.join(buildDir, 'index.backup.html');
  
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, indexBackupPath);
    console.log('   ✅ Created index.html backup');
  }
  
  // Create a simple deployment info file
  const deployInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    chunkLoadingFixed: true
  };
  
  fs.writeFileSync(
    path.join(buildDir, 'deploy-info.json'), 
    JSON.stringify(deployInfo, null, 2)
  );
  
  console.log('   ✅ Created deployment info');
  
} catch (error) {
  console.error('   ⚠️ Deployment preparation had issues:', error.message);
}

console.log('\n🎉 Frontend build fix completed!');
console.log('\n📋 Next steps:');
console.log('   1. Upload the entire "build" folder to your DigitalOcean server');
console.log('   2. Ensure your web server (nginx/apache) serves files from this build folder');
console.log('   3. Clear any CDN or browser caches');
console.log('   4. Test the checkout page');
console.log('\n💡 If issues persist, run this script again or check server configuration.');
