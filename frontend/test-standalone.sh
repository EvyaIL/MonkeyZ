#!/bin/bash
# Script to test the standalone server locally

# Ensure we have a build directory with an index.html
if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
  echo "Building React app first..."
  npm run build
fi

# Add health check file
echo '{"status":"healthy"}' > build/health.json

# Start the standalone server
echo "Starting standalone server..."
node standalone-server.js
