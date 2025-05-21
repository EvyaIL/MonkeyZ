#!/bin/bash
# Minimal build script for DigitalOcean

# Install dependencies
npm install

# Build React app
npm run build

# Ensure health check file exists in build directory
echo '{"status":"healthy"}' > build/health.json

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
