# MonkeyZ - DigitalOcean Deployment Guide

This repository contains the MonkeyZ application, ready for deployment to DigitalOcean App Platform.

## Project Structure

- `backend/` - FastAPI backend API
- `frontend/` - React frontend application

## Deployment Preparation Checklist

Before deploying to DigitalOcean, ensure:

- [ ] All empty files have been removed or properly initialized
- [ ] MongoDB connection is tested and working
- [ ] Environment variables are properly configured
- [ ] Health check endpoint is implemented in the backend
- [ ] Frontend is properly configured to connect to the backend

## Backend Deployment

1. Create a new app in DigitalOcean App Platform
2. Connect to your GitHub repository
3. Select the `backend` directory
4. Configure environment variables according to `.env.template`
5. Set build command to `pip install -r requirements.txt`
6. Set run command to `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Deploy the app
8. Test the health endpoint at `https://your-app-url/health`

## Frontend Deployment

1. Create a new static site in DigitalOcean App Platform
2. Connect to your GitHub repository
3. Select the `frontend` directory
4. Configure environment variables according to `.env.template`
5. Set build command to `npm install && npm run build`
6. Set output directory to `build`
7. Deploy the app
8. Verify the site loads correctly

## MongoDB Setup

1. Create a MongoDB database in DigitalOcean (or use another provider)
2. Get the connection string
3. Configure the backend with the connection string
4. Test the connection using `test_mongodb_connection.py`

## Final Verification

- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] User authentication works
- [ ] Product listings are visible
- [ ] API calls between frontend and backend work correctly

## Troubleshooting

If you encounter issues during deployment, check:

1. DigitalOcean App Platform logs
2. MongoDB connection string format
3. Environment variables configuration
4. CORS settings for API requests

For more detailed instructions, refer to `DIGITALOCEAN_DEPLOYMENT.md`.
