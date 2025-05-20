# Deployment Guide for DigitalOcean App Platform

This guide explains how to deploy the MonkeyZ application to DigitalOcean App Platform.

## Prerequisites

1. A DigitalOcean account
2. MongoDB database (managed by DigitalOcean)
3. All required API keys and credentials

## Backend Deployment

The backend is a FastAPI application that should be deployed as an App Platform Service.

### Configuration

1. **Source Repository**: Connect your GitHub repository
2. **Branch**: Select your main branch
3. **Source Directory**: `/backend`
4. **Build Command**: `pip install -r requirements.txt`
5. **Run Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Environment Variables

Set the following environment variables in the DigitalOcean App Platform dashboard:

```
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
SECRET_KEY=your_secure_secret_key

# MongoDB connection for DigitalOcean Managed Database (use the exact string from DO dashboard)
MONGODB_URI=mongodb+srv://doadmin:password@private-mongodb-cluster-url/admin?tls=true&authSource=admin

# EmailJS configuration
EMAILJS_SERVICE_ID=service_xheer8t
EMAILJS_USER_ID=OZANGbTigZyYpNfAT
EMAILJS_TEMPLATE_ID_PASSWORD_RESET=template_9f1h1dn
EMAILJS_TEMPLATE_ID_OTP=template_fi5fm2c
EMAILJS_TEMPLATE_ID_WELCOME=template_iwzazla

# Other API keys
GROW_API_KEY=your_grow_api_key
```

### Important Notes for Backend

1. **MongoDB Connection**: Make sure to use the exact connection string from the DigitalOcean MongoDB dashboard. It should include all replica set hosts, TLS settings, and authSource.
   
2. **Environment Variables**: Only the environment variables set in the DigitalOcean dashboard matter for production deployment. The `.env` file in your repo is not used.

3. **Logging**: The application is configured to log to standard output, which DigitalOcean will capture.

## Frontend Deployment

The frontend is a React application that should be deployed as a static site.

### Configuration

1. **Source Repository**: Connect your GitHub repository
2. **Branch**: Select your main branch
3. **Source Directory**: `/frontend`
4. **Build Command**: `npm install && npm run build`
5. **Output Directory**: `build`

### Environment Variables

Set the following environment variables in the DigitalOcean App Platform dashboard:

```
REACT_APP_PATH_BACKEND=https://your-backend-app-url.ondigitalocean.app
REACT_APP_GOOGLE_CLIENT_ID=946645411512-tn9qmppcsnp5oqqo88ivkuapou2cmg53.apps.googleusercontent.com

# EmailJS configuration (use exact values from backend for consistency)
REACT_APP_EMAILJS_PUBLIC_KEY=OZANGbTigZyYpNfAT
REACT_APP_EMAILJS_SERVICE_ID=service_xheer8t
REACT_APP_EMAILJS_RESET_TEMPLATE=template_9f1h1dn
REACT_APP_EMAILJS_OTP_TEMPLATE=template_fi5fm2c
REACT_APP_EMAILJS_WELCOME_TEMP=template_iwzazla

# Payment redirects
REACT_APP_PAYMENT_FAIL_URL=https://your-frontend-url.ondigitalocean.app/fail
REACT_APP_PAYMENT_SUCCESS_URL=https://your-frontend-url.ondigitalocean.app/success
REACT_APP_GROW_API_KEY=your_grow_api_key
```

### Important Notes for Frontend

1. **API Endpoint**: Make sure `REACT_APP_PATH_BACKEND` points to your deployed backend URL.

2. **Build Output**: The build output directory must be set to `build` (React's default output directory).

## MongoDB Configuration

1. In the DigitalOcean dashboard, create a new MongoDB database cluster.
2. Choose the appropriate connection method:
   
   - **Public Network Connection (Recommended for beginners):**
     - More straightforward to set up
     - Works from anywhere without additional configuration
     - Connection string format:
       ```
       mongodb+srv://doadmin:password@mongodb1-xxxx.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1
       ```

   - **VPC/Private Network Connection (More secure):**
     - Requires backend and database to be in the same region
     - More secure as database is not exposed to the public internet
     - Connection string format:
       ```
       mongodb+srv://doadmin:password@private-mongodb1-xxxx.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=rs-xxxx
       ```

3. Use the "doadmin" user for connection (or create a dedicated user with appropriate permissions).
4. Get the connection string from the DigitalOcean MongoDB dashboard.
5. **IMPORTANT**: Make sure your MongoDB URI includes the `replicaSet` parameter. If the parameter is missing from the connection string provided by DigitalOcean, our code will attempt to add it automatically, but it's better to specify it directly:

## Setting Up Domain Names

To use custom domains:

1. In the DigitalOcean App Platform dashboard, go to your app's settings.
2. Select the "Domains" tab.
3. Add your domains (e.g., monkeyz.co.il for frontend, api.monkeyz.co.il for backend).
4. Configure your DNS provider to point to the provided DigitalOcean URLs.

## Troubleshooting

### Backend Connection Issues

If you see MongoDB connection errors:
- Verify the MONGODB_URI is correct and includes all replica set information
- Ensure the database user has the correct permissions
- Check if your app is in the same region as your database

### Frontend API Connection Issues

If the frontend can't connect to the backend:
- Verify CORS settings in your backend (`allow_origins` in main.py)
- Check that REACT_APP_PATH_BACKEND points to the correct URL
- Ensure SSL certificates are valid if using HTTPS

### Deployment Failures

If deployment fails:
- Check the deployment logs in the DigitalOcean dashboard
- Verify that all required environment variables are set
- Make sure the package.json has the correct scripts and dependencies

## Maintenance Recommendations

1. **Database Backups**: Enable automatic backups for your MongoDB cluster
2. **Monitoring**: Set up monitoring alerts for your applications
3. **Scaling**: Adjust resources as needed based on usage patterns
4. **Updates**: Regularly update dependencies to fix security vulnerabilities
