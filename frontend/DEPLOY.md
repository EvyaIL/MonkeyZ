# Frontend Deployment Guide

This document provides detailed instructions for deploying the React frontend to DigitalOcean App Platform.

## Prerequisites

- DigitalOcean account with billing set up
- Backend API already deployed and running
- GitHub repository with frontend code

## Deployment Steps

### 1. Environment Variables

Set the following environment variables in the DigitalOcean App Platform:

```
REACT_APP_PATH_BACKEND=https://your-backend-app-url.ondigitalocean.app
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
REACT_APP_EMAILJS_SERVICE_ID=your_service_id
REACT_APP_EMAILJS_RESET_TEMPLATE=your_reset_template_id
REACT_APP_EMAILJS_OTP_TEMPLATE=your_otp_template_id
REACT_APP_EMAILJS_WELCOME_TEMP=your_welcome_template_id
REACT_APP_PAYMENT_FAIL_URL=https://your-frontend-url.ondigitalocean.app/fail
REACT_APP_PAYMENT_SUCCESS_URL=https://your-frontend-url.ondigitalocean.app/success
```

### 2. App Platform Configuration

1. On DigitalOcean dashboard, go to Apps > Create App > Static Site
2. Connect your GitHub repository
3. Configure the app:
   - Source Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `build`
4. Add environment variables from step 1
5. Configure routes:
   - Specify any custom routes if needed
   - Set up a catch-all route for SPA: `/*` → `/index.html`

### 3. Post-Deployment Verification

1. Check that the site loads correctly
2. Verify authentication works
3. Test all major features:
   - User login/signup
   - Product browsing
   - Checkout process
   - Profile management

### 4. Troubleshooting

- Check browser console for errors
- Verify API endpoint URLs are correct
- Test CORS headers on backend
- Check environment variables are correctly set

### 5. Domain Configuration

1. In DigitalOcean dashboard, go to Networking > Domains
2. Add your custom domain
3. Create A records pointing to your app
4. Set up SSL/TLS certificates

### 6. Performance Optimization

- Enable caching for static assets
- Set appropriate cache headers
- Configure CDN if needed

### 7. Monitoring and Analytics

- Set up monitoring in DigitalOcean dashboard
- Configure Google Analytics or similar