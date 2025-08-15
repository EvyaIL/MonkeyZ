const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

// Generate a nonce for CSP
const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

// Security middleware for PayPal integration
app.use((req, res, next) => {
  const nonce = generateNonce();
  
  // Detect environment
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_API_URL?.includes('localhost');
  
  // PayPal and Google OAuth Best Practice: CSP Headers
  const connectSrc = [
    "'self'",
    "*.paypal.com",
    "*.paypalobjects.com", 
    "*.venmo.com",
    "https://accounts.google.com",
    "https://api.monkeyz.co.il",
    "https://www.google-analytics.com",
    "https://analytics.google.com"
  ];
  
  // Add localhost for development
  if (isDevelopment) {
    connectSrc.push("http://localhost:8000", "http://127.0.0.1:8000");
    console.log('🔧 Development mode detected - allowing localhost connections in CSP');
  }
  
  const cspPolicy = [
    "default-src 'self'",
    `script-src 'self' *.paypal.com *.paypalobjects.com *.venmo.com https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com 'nonce-${nonce}' 'unsafe-eval'`,
    `connect-src ${connectSrc.join(' ')}`,
    "child-src 'self' *.paypal.com *.paypalobjects.com *.venmo.com https://accounts.google.com",
    "frame-src 'self' *.paypal.com *.paypalobjects.com *.venmo.com https://accounts.google.com",
    "img-src 'self' *.paypal.com *.paypalobjects.com *.venmo.com https://accounts.google.com https://www.google-analytics.com data: https:",
    `style-src 'self' *.paypal.com *.paypalobjects.com *.venmo.com https://accounts.google.com 'nonce-${nonce}'`,
    "font-src 'self' data: https:",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');

  // Set security headers
  res.setHeader('Content-Security-Policy', cspPolicy);
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Store nonce for template injection
  res.locals.nonce = nonce;
  next();
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle health check
app.get('/health.json', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React routing - serve index.html for all routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  
  // Check if build directory exists
  if (fs.existsSync(indexPath)) {
    // Read the HTML file and inject the nonce
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Replace placeholder with actual nonce for CSP
    html = html.replace(/nonce-PLACEHOLDER/g, `nonce-${res.locals.nonce}`);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } else {
    res.status(503).json({ 
      error: 'Build not found', 
      message: 'Please run npm run build first' 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});

module.exports = app;
