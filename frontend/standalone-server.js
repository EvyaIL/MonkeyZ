const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Proxy middleware for Meshulam SDK
app.use('/sdk-proxy', createProxyMiddleware({
  target: process.env.NODE_ENV === 'production' 
    ? 'https://meshulam.co.il'
    : 'https://sandbox.meshulam.co.il',
  changeOrigin: true,
  pathRewrite: {
    '^/sdk-proxy': '/api/light/server/1.0'
  },
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'health.html'));
});

// Catch all routes
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start the server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at: http://localhost:${port}/health`);
});
