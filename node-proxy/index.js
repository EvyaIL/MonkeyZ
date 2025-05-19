require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Logging middleware to print incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Proxy setup
app.use('/api', createProxyMiddleware({
  target: process.env.PYTHON_BACKEND,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`↪️ Proxying to: ${process.env.PYTHON_BACKEND}${req.originalUrl.replace(/^\/api/, '')}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error');
  }
}));

// Start server
const PORT = process.env.PORT_NODE || 3001;
const HOST = process.env.HOST_NODE || 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Proxy running on http://${HOST}:${PORT}`);
});
