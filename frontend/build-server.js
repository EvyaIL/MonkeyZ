/**
 * Simple Express server for the build directory
 * This file is copied to the build directory during deployment
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Log startup for debugging
console.log('Starting Build Directory Express server...');
console.log('Current directory:', process.cwd());
console.log('Files in current directory:', fs.readdirSync('.').join(', '));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the current directory (build directory)
app.use(express.static('.'));

// Health check endpoints - multiple paths for flexibility
app.get(['/health.json', '/health', '/.well-known/health'], (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// All routes not handled by the static middleware will serve index.html
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
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health.json`);
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
