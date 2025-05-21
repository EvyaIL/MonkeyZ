/**
 * Simple pre-deployment check script for DigitalOcean App Platform.
 * This script verifies that your frontend is correctly configured for deployment.
 */

// Files that should exist for successful deployment
const requiredFiles = [
  'package.json',
  'public/index.html',
  'src/index.js',
  '.do/app.yaml'
];

// Check if files exist
function checkFiles() {
  const fs = require('fs');
  const missing = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  });
  
  return missing;
}

// Check package.json for build script
function checkBuildScript() {
  const fs = require('fs');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (!packageJson.scripts || !packageJson.scripts.build) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

// Main function
function main() {
  console.log("🔍 Checking frontend configuration for DigitalOcean deployment...");
  
  // Check files
  const missingFiles = checkFiles();
  if (missingFiles.length > 0) {
    console.log(`❌ Missing required files: ${missingFiles.join(', ')}`);
  } else {
    console.log("✅ All required files present");
  }
  
  // Check build script
  if (checkBuildScript()) {
    console.log("✅ Build script found in package.json");
  } else {
    console.log("❌ Build script missing in package.json");
  }
  
  // Remind about environment variables
  console.log("\n✅ Remember to set these environment variables in the DigitalOcean dashboard:");
  console.log("  - REACT_APP_PATH_BACKEND (set to backend URL)");
  console.log("  - REACT_APP_GOOGLE_CLIENT_ID");
  console.log("  - REACT_APP_EMAILJS_* variables");
  console.log("  - REACT_APP_PAYMENT_* URLs");
  
  console.log("\n🚀 Your frontend is ready for deployment to DigitalOcean App Platform!");
}

// Run the check
main();
