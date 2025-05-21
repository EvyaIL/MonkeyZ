// Enhanced Express server for DigitalOcean deployment
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Log startup diagnostics
console.log('=== Server Startup Diagnostics ===');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.').join(', '));
console.log('Node version:', process.version);
console.log('================================');

// Request logging
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
app.get(['/health.json', '/health', '/.well-known/health'], (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// Serve React app for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, buildPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health.json`);
});
