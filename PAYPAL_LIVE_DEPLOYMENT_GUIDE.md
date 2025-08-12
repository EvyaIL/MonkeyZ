# 🚀 PayPal Live Mode Deployment Guide

## Overview
This guide walks you through switching PayPal from sandbox to live mode for production deployment.

## ⚠️ Critical Prerequisites

### 1. PayPal Business Account Setup
- [ ] Have a verified PayPal Business account
- [ ] Complete PayPal's identity verification process
- [ ] Have your business bank account linked
- [ ] Ensure your account is approved for receiving payments

### 2. PayPal Live Credentials
- [ ] Log into [PayPal Developer Console](https://developer.paypal.com/)
- [ ] Navigate to "My Apps & Credentials"
- [ ] Switch to "Live" environment (not Sandbox)
- [ ] Create a new app or use existing live app
- [ ] Copy your Live Client ID and Secret

## 🔧 Backend Configuration

### 1. Update Backend Environment Variables
Replace these in your production environment:

```bash
# Switch PayPal to live mode
PAYPAL_MODE=live

# Use your LIVE PayPal credentials
PAYPAL_LIVE_CLIENT_ID=your_actual_live_client_id_here
PAYPAL_LIVE_CLIENT_SECRET=your_actual_live_client_secret_here

# Ensure production environment
ENVIRONMENT=production
```

### 2. Verify Backend Configuration
Use the health check endpoint we created:
```bash
curl https://api.monkeyz.co.il/api/paypal/health
```

Expected response:
```json
{
  "status": "healthy",
  "paypal_config": {
    "mode": "live",
    "client_id_configured": true,
    "client_secret_configured": true,
    "environment": "production"
  },
  "production_ready": true,
  "issues": []
}
```

## 🎨 Frontend Configuration

### 1. Update Frontend Environment Variables
In your production deployment, set:

```bash
# PayPal Live Configuration
REACT_APP_PAYPAL_CLIENT_ID=your_actual_live_client_id_here

# Ensure production URLs
REACT_APP_API_URL=https://api.monkeyz.co.il
REACT_APP_PAYMENT_SUCCESS_URL=https://monkeyz.co.il/success
REACT_APP_PAYMENT_FAIL_URL=https://monkeyz.co.il/fail
REACT_APP_PAYMENT_CANCEL_URL=https://monkeyz.co.il/checkout
```

### 2. Verify Frontend Configuration
Use the production readiness checker:
- Access `/admin/production-readiness` in your app
- Check that PayPal shows "✅ Production Ready"

## 🧪 Testing PayPal Live Mode

### 1. Test with Small Amounts
- Start with $0.01 transactions
- Use real credit cards (your own for testing)
- Verify money actually moves between accounts

### 2. Test All Payment Flows
- [ ] Successful payment completion
- [ ] Payment cancellation
- [ ] Payment failure scenarios
- [ ] Refund processing (if implemented)

### 3. Verify Webhooks (if used)
- Test PayPal webhooks with live transactions
- Ensure your webhook endpoints handle live events

## 🚨 Security Checklist

### 1. Environment Security
- [ ] Never commit live credentials to version control
- [ ] Use environment variable injection in deployment
- [ ] Rotate credentials if they were ever exposed

### 2. SSL/HTTPS
- [ ] Ensure entire site runs on HTTPS
- [ ] Verify SSL certificate is valid
- [ ] Test PayPal integration over HTTPS

### 3. Domain Verification
- [ ] Update PayPal app settings with production domain
- [ ] Verify return URLs match your production domains
- [ ] Test redirect flows

## 📊 Monitoring Live PayPal

### 1. Real-time Monitoring
Our implemented monitoring includes:
- PayPal API connectivity checks
- Transaction success/failure rates
- Error tracking for payment issues

### 2. PayPal Dashboard
- Monitor transactions in PayPal Business account
- Set up PayPal notifications for important events
- Review transaction reports regularly

## 🔄 Rollback Plan

### If Issues Occur:
1. **Immediate**: Switch back to sandbox mode
   ```bash
   PAYPAL_MODE=sandbox
   ```
2. **Investigate**: Check logs and error reports
3. **Fix**: Address issues in staging environment
4. **Retry**: Switch back to live mode after fixes

## 📋 Go-Live Checklist

### Before Switching to Live:
- [ ] All tests pass in sandbox mode
- [ ] Backend health checks show "healthy"
- [ ] Frontend readiness checker shows all green
- [ ] SSL certificate is valid and active
- [ ] PayPal business account is verified
- [ ] Live credentials are securely configured
- [ ] Monitoring is active and alerts configured

### After Switching to Live:
- [ ] Process a test transaction with real money
- [ ] Verify transaction appears in PayPal dashboard
- [ ] Check that success/failure pages work correctly
- [ ] Monitor for any errors in the first hour
- [ ] Verify email notifications work (if implemented)

## 🆘 Troubleshooting

### Common Issues:

**PayPal API Errors:**
- Check credentials are correct and for live environment
- Verify PayPal account is in good standing
- Ensure API permissions are granted

**Transaction Failures:**
- Check if amounts are within PayPal limits
- Verify currency settings match your account
- Check for geographic restrictions

**SSL/Security Issues:**
- Ensure all PayPal calls use HTTPS
- Verify domain is registered with PayPal app
- Check for mixed content warnings

## 📞 Support

- **PayPal Developer Support**: [developer.paypal.com/support](https://developer.paypal.com/support)
- **PayPal Merchant Support**: Through your PayPal Business account
- **Emergency Rollback**: Switch `PAYPAL_MODE=sandbox` immediately

---

**⚠️ Remember**: Always test thoroughly with small amounts before processing real customer payments!
