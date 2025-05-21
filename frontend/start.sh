#!/bin/bash
# DigitalOcean startup script with multiple fallbacks

echo "======= STARTUP DIAGNOSTICS ======="
echo "Date: $(date)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"
echo "PATH: $PATH"
echo "=================================="

# Define multiple ways to start serve
serve_methods=(
  "npx serve -s build -l 8080"                # Use npx to run serve
  "node_modules/.bin/serve -s build -l 8080"  # Try local install path
  "node_modules/serve/bin/serve.js -s build -l 8080" # Direct path to serve.js
  "npm run serve"                             # Use npm script
  "./node_modules/serve/bin/serve.js -s build -l 8080" # Another path variant
  "serve -s build -l 8080"                    # Try directly (if in PATH)
)

# Function to check if a command exists
command_exists() {
  command -v "$1" &> /dev/null
}

# Try different serve methods
for method in "${serve_methods[@]}"; do
  echo "Trying to start with: $method"
  $method &
  SERVE_PID=$!
  
  # Wait for serve to start
  sleep 8
  
  # Check if server is responding to health check
  if curl -s http://localhost:8080/health.json > /dev/null; then
    echo "🟢 Server is responding to health checks! Using: $method"
    echo "Server running with PID: $SERVE_PID"
    wait $SERVE_PID
    exit $?
  elif kill -0 $SERVE_PID 2>/dev/null; then
    echo "⚠️ Server started but not responding to health checks. Stopping..."
    kill $SERVE_PID
  else
    echo "❌ Server failed to start with: $method"
  fi
  
  # Make sure any previous attempt is killed
  kill $SERVE_PID 2>/dev/null || true
done

# If all serve attempts failed, fall back to express
echo "All serve attempts failed, falling back to Express server..."

# Make sure we have express installed
npm list express --depth=0 || npm install express

# Check if server.js exists
if [ -f "server.js" ]; then
  echo "Starting Express server from server.js..."
  node server.js
elif [ -f "build/server.js" ]; then
  echo "Starting Express server from build/server.js..."
  node build/server.js
else
  echo "Creating enhanced Express server on the fly..."
  
  # Create an enhanced fallback server with more diagnostics and resilience
  cat > enhanced-server.js << 'EOL'
/**
 * Enhanced Express fallback server for DigitalOcean deployment
 * Created automatically by start.sh when serve fails to start
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Print extensive diagnostics
console.log('==================== SERVER DIAGNOSTICS ====================');
console.log(`Starting time: ${new Date().toISOString()}`);
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);
console.log(`Server file location: ${__filename}`);
console.log(`Environment: ${JSON.stringify(process.env.NODE_ENV || 'not set')}`);

// List directories to diagnose path problems
try {
  console.log('\nDIRECTORY STRUCTURE:');
  console.log(`Current directory: ${fs.readdirSync('.').join(', ')}`);
  if (fs.existsSync('./build')) {
    console.log(`Build directory: ${fs.readdirSync('./build').join(', ')}`);
  } else {
    console.log('Build directory not found!');
  }
} catch (err) {
  console.error(`Error reading directories: ${err.message}`);
}
console.log('===========================================================');

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Determine build folder path - try multiple options
let buildPath = './build';
if (!fs.existsSync(buildPath)) {
  const alternatives = ['.', '../build', '../..', '../../build'];
  for (const alt of alternatives) {
    if (fs.existsSync(path.join(alt, 'index.html'))) {
      buildPath = alt;
      console.log(`Found build files in alternative path: ${alt}`);
      break;
    }
  }
}

// Serve static files from build directory
console.log(`Serving static files from: ${buildPath}`);
app.use(express.static(buildPath));

// Multiple health check endpoints
app.get('/health.json', (req, res) => {
  console.log('Health check requested (JSON)');
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  console.log('Health check requested (HTML)');
  res.send('<html><body><h1>Health check passed!</h1></body></html>');
});

// Default route that serves the index.html
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(path.resolve(indexPath));
  } else {
    res.status(404).send('Cannot find index.html');
  }
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health.json`);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
EOL
  
  # Run the enhanced server
  node enhanced-server.js
fi
