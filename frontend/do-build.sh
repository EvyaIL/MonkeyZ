#!/bin/bash
# Ultra-simplified build script for DigitalOcean

echo "===== DIAGNOSTICS ====="
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "======================="

# Install tools globally (required for DigitalOcean)
echo "Installing global tools..."
npm install -g serve react-scripts

# Install dependencies with maximum compatibility
echo "Installing dependencies..."
npm install --no-optional --no-audit --no-fund

# Build the React app
echo "Building React application..."
CI=false npm run build

# Create health check files
echo "Creating health check endpoints..."
echo '{"status":"healthy"}' > build/health.json
cp public/health.html build/health.html

# Create specialized files for DigitalOcean
echo "Creating startup files for DigitalOcean..."
cp server.js build/
cp start.sh build/
chmod +x build/start.sh

# Create a simplified package.json in the build directory
echo "Creating simplified package.json..."
cat > build/package.json << 'EOL'
{
  "name": "monkeyz-frontend-production",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.18.2",
    "serve": "^14.2.1"
  },
  "scripts": {
    "start": "serve -s . -l 8080 || node server.js"
  }
}
EOL

# Add Procfile in build directory
echo "Creating Procfile..."
echo "web: npm start" > build/Procfile

echo "Build completed successfully!"
echo "Files in build directory:"
ls -la build/
