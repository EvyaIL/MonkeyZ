#!/bin/bash
# Install express first
npm install express
# Then start the server
node server.js

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
