#!/bin/bash
# Ultra-minimal deployment script for DigitalOcean

# Show our current environment
echo "Node.js version: $(node -v)"
echo "Current directory: $(pwd)"
echo "Files: $(ls -la)"

# Build the React app
echo "Building the React app..."
npm ci --only=production || npm install --only=production
npm run build

# Ensure health check file exists in build directory
echo "Creating health check files..."
echo '{"status":"healthy"}' > build/health.json
touch build/health.html
echo '<html><body><h1>Health check passed</h1></body></html>' > build/health.html

# Ensure the standalone server is in the right place
echo "Setting up server..."
cp standalone-server.js .

echo "Deployment preparation complete."
