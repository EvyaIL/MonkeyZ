/**
 * Simplified Express server for DigitalOcean deployment
 */
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health.json', (req, res) => {
  res.json({ status: 'healthy' });
});

// Route all requests to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
