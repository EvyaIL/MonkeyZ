# DigitalOcean Health Check Verification

This checklist helps troubleshoot health check issues on DigitalOcean App Platform that lead to the `Readiness probe failed` error.

## Frontend Health Check Checklist

1. **Verify health endpoint files**
   - [x] `public/health.json` exists
   - [x] `public/health.html` exists
   - [ ] Build process copies these files to the `build` directory

2. **Verify app.yaml configuration**
   - [x] Using `services` instead of `static_sites`
   - [x] Proper `http_port: 8080` configuration
   - [x] Health check configured with correct path: `/health.json`
   - [x] Health check has reasonable timing parameters

3. **Verify server configuration**
   - [x] Server listens on port 8080 (matches health check port)
   - [x] Server properly serves the health check endpoint
   - [x] Server has fallback mechanisms if primary server fails

4. **Verify package.json**
   - [x] `serve` is listed as a dependency
   - [x] `express` is listed as a dependency (for fallback)
   - [x] `start` script is configured properly for production

5. **Verify Dockerfile**
   - [x] Proper Node.js version
   - [x] Installation of necessary tools (curl)
   - [x] Health check configuration
   - [x] Expose port 8080
   - [x] Proper CMD for starting the server

## How to Test Health Checks Locally

1. Build your app: `npm run build`
2. Start the production server: `npm start`
3. Test the health endpoint: `curl http://localhost:8080/health.json`
4. Expected response: `{"status":"healthy"}`

## Common DigitalOcean Health Check Errors

1. **Connection refused**
   - Server not listening on the expected port
   - App crash before health check can connect
   - Port mismatch between app configuration and health check

2. **HTTP 404 Not Found**
   - Health check endpoint path is incorrect
   - Build process did not copy health check file
   - Server routing issue

3. **HTTP 500 Internal Server Error**
   - Server error when processing health check request
   - Application startup error

## Quick Fixes

1. If using static hosting approach:
   ```
   serve -s build -l 8080
   ```

2. If using Express approach:
   ```javascript
   app.get('/health.json', (req, res) => {
     res.json({ status: 'healthy' });
   });
   ```

3. Use the fallback server script:
   ```
   bash ./do-run.sh
   ```
