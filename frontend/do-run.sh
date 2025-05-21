#!/bin/bash
# This script will be run during the startup process on DigitalOcean

# Check if build directory exists
if [ ! -d "build" ]; then
    echo "Error: Build directory not found! Running build process..."
    npm run build
    
    if [ ! -d "build" ]; then
        echo "Error: Build failed! Using fallback server..."
        node server.js
        exit 0
    fi
fi

# Make sure health.json exists
if [ ! -f "build/health.json" ]; then
    echo "Creating health check file..."
    echo '{"status":"healthy"}' > build/health.json
fi

# Start the server
echo "Starting the server..."
if command -v serve &> /dev/null; then
    echo "Using serve for static hosting..."
    serve -s build -l 8080
else
    echo "Serve not found, using Express fallback server..."
    node server.js
fi
