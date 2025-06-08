# MonkeyZ DigitalOcean Deployment Instructions

## Prerequisites
1. DigitalOcean account with billing set up
2. GitHub repository connected to DigitalOcean App Platform
3. MongoDB database provisioned on DigitalOcean or another provider

## Backend Deployment (App Service)

1. Log in to your DigitalOcean dashboard
2. Go to App Platform > Create App > GitHub
3. Select your repository and branch
4. Configure as follows:
   - Source Directory: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Set required environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `SECRET_KEY`: A secure random string
   - `ALGORITHM`: HS256
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: 30
   - Other API keys and credentials

6. Configure health check:
   - HTTP Path: `/health`
   - Port: Default
   - Interval: 10 seconds
   - Timeout: 5 seconds
   - Failure Threshold: 3

7. Review and launch

## Frontend Deployment (Static Site)

1. Log in to your DigitalOcean dashboard
2. Go to App Platform > Create App > GitHub
3. Select your repository and branch
4. Configure as follows:
   - Source Directory: `/frontend`
   - Build Command: `npm install && npm run build`
   - Output Directory: `build`

5. Set required environment variables:
   - `REACT_APP_PATH_BACKEND`: URL to your deployed backend service
   - Other API keys and credentials

6. Review and launch

## Post-Deployment Verification

1. Check the backend health endpoint: `https://your-backend-url.ondigitalocean.app/health`
2. Verify the frontend loads correctly
3. Test authentication and other critical features
4. Check MongoDB connection by testing a data-dependent endpoint

## Troubleshooting

1. Check app logs in the DigitalOcean dashboard
2. Verify environment variables are set correctly
3. Check MongoDB connectivity
4. Ensure CORS settings allow communication between frontend and backend
