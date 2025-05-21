/**
 * Simple Express server for production hosting
 * This is used when serve doesn't work
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Log startup for debugging
console.log('Starting Express server...');
console.log('Current directory:', process.cwd());
console.log('Directory contents:', fs.readdirSync('.'));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health.json', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'healthy' });
});

// Route all requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
