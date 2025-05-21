const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');
const http = require('http');

module.exports = function(app) {
  // Proxy all Meshulam API requests (including SDK JS)
  app.use(
    '/api/meshulam',
    createProxyMiddleware({
      target: 'https://sandbox.meshulam.co.il',
      changeOrigin: true,
      secure: true,
      pathRewrite: {
        '^/api/meshulam': ''
      },
      onProxyReq: (proxyReq, req, res) => {
        // Add necessary headers to look like a browser request
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        proxyReq.setHeader('Accept', '*/*');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9,he;q=0.8');
        proxyReq.setHeader('Origin', 'https://sandbox.meshulam.co.il');
        proxyReq.setHeader('Referer', 'https://sandbox.meshulam.co.il/');
      },
      onProxyRes: (proxyRes, req, res) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
        
        // Ensure JavaScript content type for SDK requests
        if (req.path.includes('/api/light/server/1.0/js')) {
          proxyRes.headers['Content-Type'] = 'application/javascript; charset=utf-8';
        }
      }
    })
  );

      // Log the request details
      console.log('Proxying request to:', options.hostname + options.path);

      const proxyReq = https.request(options, (proxyRes) => {
        // Log response headers
        console.log('SDK proxy response status:', proxyRes.statusCode);
        console.log('SDK proxy response headers:', proxyRes.headers);
        
        // Handle redirects manually if needed
        if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
          console.log('Following redirect to:', proxyRes.headers.location);
          
          // Parse the redirect URL
          const redirectUrl = new URL(proxyRes.headers.location);
          
          const redirectOptions = {
            hostname: redirectUrl.hostname,
            path: redirectUrl.pathname + redirectUrl.search,
            method: 'GET',
            headers: options.headers
          };
          
          // Make a new request to the redirect location
          const redirectReq = https.request(redirectOptions, (redirectRes) => {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            
            // Forward the status code
            res.statusCode = redirectRes.statusCode;
            
            // Handle the content
            let responseData = '';
            redirectRes.on('data', (chunk) => {
              responseData += chunk;
            });
            
            redirectRes.on('end', () => {
              // Check if we got HTML instead of JavaScript
              if (responseData.trim().startsWith('<!DOCTYPE') || responseData.trim().startsWith('<html')) {
                console.error('Received HTML instead of JavaScript');
                res.setHeader('Content-Type', 'application/javascript');
                res.end(`console.error("SDK proxy error: Received HTML instead of JavaScript");`);
              } else {
                res.end(responseData);
              }
            });
          });
          
          redirectReq.on('error', (err) => {
            console.error('SDK Redirect Proxy Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/javascript' });
            res.end(`console.error("SDK redirect proxy error: ${err.message}");`);
          });
          
          redirectReq.end();
          return;
        }
        
        // Set proper content type for JavaScript
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        
        // Set CORS headers to allow access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        
        // No caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Forward the status code
        res.statusCode = proxyRes.statusCode;
        
        // Check the content type
        const contentType = proxyRes.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.warn('Received HTML content instead of JavaScript');
          
          // Collect the HTML response to debug
          let htmlContent = '';
          proxyRes.on('data', (chunk) => {
            htmlContent += chunk;
          });
          
          proxyRes.on('end', () => {
            console.error('HTML content received:', htmlContent.substring(0, 200) + '...');
            
            // Return a JavaScript error instead of the HTML
            res.setHeader('Content-Type', 'application/javascript');
            res.end(`console.error("SDK proxy error: Received HTML instead of JavaScript");`);
          });
        } else {
          // Direct piping for JS content
          proxyRes.pipe(res);
        }
      });

      proxyReq.on('error', (err) => {
        console.error('SDK Proxy Error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/javascript',
        });
        res.end(`console.error("SDK proxy error: ${err.message}");`);
      });

      proxyReq.end();
    }
  );
  
  // Alternative endpoint that delivers a mock SDK when real SDK can't be loaded
  app.use(
    '/sdk-proxy/fallback-js',
    (req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      // Create a minimal mock version of the SDK that will allow testing
      const fallbackSdkCode = `
        console.warn("Using fallback SDK implementation!");
        
        // Create a minimal SDK implementation for testing
        window.growPayment = {
          configure: function(config) {
            console.log("Grow SDK mock configured:", config);
            return true;
          },
          renderPaymentOptions: function(authCode) {
            console.log("Rendering payment options with auth code:", authCode);
            alert("This is a fallback implementation. In a real environment, you would see payment options here.");
            
            // Simulate successful payment after 3 seconds
            setTimeout(function() {
              if (config && config.events && typeof config.events.onSuccess === 'function') {
                config.events.onSuccess({
                  status: 1,
                  data: {
                    payment_sum: 10000, // 100 ILS
                    payment_method: "Credit Card",
                    number_of_payments: 1,
                    transaction_id: "mock-" + Date.now(),
                    email: "test@example.com",
                    fullName: "Test User",
                    orderId: "mock-order-" + Date.now()
                  }
                });
              }
            }, 3000);
          }
        };
        
        console.log("Grow SDK mock loaded successfully");
      `;
      
      res.end(fallbackSdkCode);
    }
  );

  // General API proxy for other Meshulam API calls
  app.use(
    '/api/meshulam',
    createProxyMiddleware({
      target: 'https://sandbox.meshulam.co.il',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/api/meshulam': ''
      },
      onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,he;q=0.8'
      },
    })
  );
};
