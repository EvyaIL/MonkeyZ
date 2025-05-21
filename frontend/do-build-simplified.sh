#!/bin/bash
# Script for building the app on DigitalOcean

echo "Starting build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build React app
echo "Building React app..."
npm run build

# Copy the production package.json for simplified deployment
echo "Setting up production environment..."
cp production-package.json build/package.json

# Install serve both globally and locally
echo "Installing serve globally and locally..."
npm install -g serve || echo "Could not install serve globally, will use local installation"
npm install --save serve

# Create health check files
echo "Creating health check endpoints..."
echo '{"status":"healthy"}' > build/health.json
echo '<html><body><h1>Health check passed!</h1></body></html>' > build/health.html

# Copy server.js to build directory for easy in-place execution
echo "Copying server files to build directory..."
cp server.js build/server.js
cp build-server.js build/build-server.js

# Ensure node_modules exists in build directory
echo "Setting up node_modules in build directory..."
cd build
npm install --production
cd ..

echo "Build completed successfully!"
