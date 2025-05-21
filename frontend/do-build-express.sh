#!/bin/bash
# Express-only build script for DigitalOcean
# Use this if the regular build script doesn't work

echo "Starting express-only build process..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install basic dependencies
npm install

# Build React app
npm run build

# Create health check endpoints
echo '{"status":"healthy"}' > build/health.json
echo '<html><body><h1>Health check passed!</h1></body></html>' > build/health.html

# Create a basic package.json in the build directory
cat > build/package.json << 'EOL'
{
  "name": "monkeyz-frontend-express",
  "version": "1.0.0",
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "scripts": {
    "start": "node server.js"
  }
}
EOL

# Create an Express-only server in the build directory
cat > build/server.js << 'EOL'
/**
 * Express-only server for DigitalOcean
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Log startup information
console.log('Express-only server starting...');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.').join(', '));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from current directory
app.use(express.static('.'));

// Health check endpoints
app.get(['/health.json', '/health', '/.well-known/health'], (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join('.', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(path.resolve(indexPath));
  } else {
    res.status(404).send('Cannot find index.html');
  }
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Express-only server running on port ${port}`);
});
EOL

# Install express in the build directory
cd build
npm install --production
cd ..

echo "Express-only build completed!"
