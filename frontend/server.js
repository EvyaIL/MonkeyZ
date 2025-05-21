// Simple Express server for DigitalOcean deployment
const express = require('express');
const path = require('path');
const app = express();

// Make sure we know the server started
console.log('Starting server...');

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint - CRITICAL for DigitalOcean
app.get('/health.json', (req, res) => {
  res.json({ status: 'healthy' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
