# Login Issues Fix Guide

## Current Issues & Solutions:

### 1. Google OAuth Origin Error
**Problem**: `The given origin is not allowed for the given client ID`
**Cause**: Google OAuth client not configured for localhost

**Solution**: Configure Google OAuth Console
1. Go to https://console.developers.google.com/apis/credentials
2. Find your client ID: `946645411512-tn9qmppcsnp5oqqo88ivkuapou2cmg53.apps.googleusercontent.com`
3. Edit the OAuth 2.0 Client
4. Add these Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
   - `https://monkeyz.co.il` (if not already there)
   - `https://www.monkeyz.co.il` (if not already there)
5. Add these Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `http://127.0.0.1:3000/auth/google/callback`
   - `https://monkeyz.co.il/auth/google/callback`

### 2. Backend 500 Error on Login
**Problem**: Internal server error on `/user/login`
**Cause**: Need to check backend logs for specific error

### 3. CSP 403 Errors
**Problem**: Content Security Policy blocking some resources
**Status**: ✅ FIXED - CSP now allows localhost in development

## Quick Test Commands:

### Test Backend Health:
```bash
curl http://localhost:8000/health
```

### Test Google OAuth Config:
```bash
curl "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=test" 
# Should return client ID validation info
```

## Current Server Status:
- ✅ Backend: Running on http://127.0.0.1:8000
- ✅ Frontend: Starting on http://localhost:3000
- ✅ Database: Connected successfully
- ✅ CSP: Updated to allow localhost
- ⚠️ Google OAuth: Needs origin configuration

## Immediate Actions Needed:
1. Configure Google OAuth Console (most critical)
2. Test login after OAuth fix
3. Check backend logs if login still fails
