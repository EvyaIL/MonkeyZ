const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/health.json',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`Health check status: ${res.statusCode}`);

  res.on('data', d => {
    console.log('Response:', d.toString());
  });
});

req.on('error', error => {
  console.error('Error:', error);
  process.exit(1);
});

req.end();
