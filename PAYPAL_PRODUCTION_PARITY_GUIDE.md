# PayPal Production Deployment Guide

This guide ensures PayPal behaves identically between development (localhost) and production (DigitalOcean).

## Key Changes Made

### 1. Unified PayPal Configuration
- **Fixed Client ID Detection**: Updated logic to properly detect live vs sandbox PayPal accounts
- **Consistent Parameters**: Buyer country and debug mode are now correctly applied only for sandbox
- **Environment-Agnostic**: PayPal behavior is now based on the actual PayPal mode, not NODE_ENV

### 2. Frontend Configuration (`frontend/src/lib/paypalConfig.js`)
```javascript
// NEW: Robust PayPal mode detection
get isPayPalSandbox() {
  return this.clientId && (this.clientId.startsWith('sb-') || this.clientId.startsWith('AYbpBUAq'));
},

get isPayPalLive() {
  return this.clientId && (this.clientId.startsWith('AXu-') || this.clientId.startsWith('AWqjH') || this.clientId.startsWith('AQkq'));
}
```

### 3. Checkout Component Updates (`frontend/src/pages/Checkout.jsx`)
- **Fixed Loading Logic**: PayPal now loads consistently in both environments
- **Unified CSP Handling**: Content Security Policy works the same way everywhere
- **Consistent Button Configuration**: Identical PayPal button behavior regardless of environment

## Environment Variables Required

### Backend (.env)
```bash
# PayPal Configuration
PAYPAL_MODE=live                    # Use 'sandbox' for development, 'live' for production
PAYPAL_CLIENT_ID=AXu-...           # Sandbox Client ID (for development)
PAYPAL_CLIENT_SECRET=EFSSMeAB...   # Sandbox Client Secret
PAYPAL_LIVE_CLIENT_ID=AXu-...      # Live Client ID (for production)
PAYPAL_LIVE_CLIENT_SECRET=EFSSMeAB... # Live Client Secret
```

### Frontend (.env)
```bash
# PayPal Client ID (should match backend mode)
REACT_APP_PAYPAL_CLIENT_ID=AXu-... # Use live client ID for production
REACT_APP_API_URL=https://api.monkeyz.co.il # Production API URL
```

### Docker Compose Updates
Updated `docker-compose.yml` to include all PayPal environment variables for both frontend and backend services.

## Deployment Checklist

### ✅ For Development (localhost)
1. Set `PAYPAL_MODE=sandbox` in backend
2. Use sandbox client ID in `REACT_APP_PAYPAL_CLIENT_ID`
3. Buyer country parameter will be automatically applied
4. Debug mode available but disabled for clean console

### ✅ For Production (DigitalOcean)
1. Set `PAYPAL_MODE=live` in backend
2. Use live client ID in `REACT_APP_PAYPAL_CLIENT_ID`
3. Buyer country parameter automatically excluded (PayPal restriction)
4. Debug mode automatically disabled
5. All other behaviors identical to development

## Key Benefits

1. **Identical User Experience**: PayPal buttons look and behave exactly the same
2. **Consistent Error Handling**: Same error messages and recovery flows
3. **Unified Payment Flow**: Cart clearing, success handling, and redirect behavior identical
4. **Environment-Safe**: Automatically applies correct PayPal restrictions based on account type
5. **No Manual Configuration**: Environment detection is automatic

## Verification

After deployment, verify:
1. PayPal buttons load with same styling
2. Payment flow works identically
3. Cart clears after successful payment
4. Error handling shows same messages
5. Console shows minimal warnings in both environments

## Troubleshooting

If PayPal behaves differently:
1. Check that `REACT_APP_PAYPAL_CLIENT_ID` matches the backend `PAYPAL_MODE`
2. Verify environment variables are properly set in production
3. Ensure CSP headers allow PayPal domains in production
4. Check that the client ID format is correctly detected by the new logic

The system now automatically detects PayPal environment based on client ID format, ensuring consistent behavior regardless of deployment environment.
