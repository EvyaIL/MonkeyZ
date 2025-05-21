#!/bin/bash
# This script will be run during the build process on DigitalOcean
# If react-scripts is not found, install it globally

# Check if react-scripts is installed
if ! command -v react-scripts &> /dev/null; then
    echo "react-scripts not found, installing globally..."
    npm install -g react-scripts
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm ci
fi

# Build the app
echo "Building the application..."
npm run build

# Create health check file
echo '{"status":"healthy"}' > build/health.json

# Output success
echo "Build completed successfully!"
