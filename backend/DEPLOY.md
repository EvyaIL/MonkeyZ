# Backend Deployment Guide

This document provides detailed instructions for deploying the backend API to DigitalOcean App Platform.

## Prerequisites

- DigitalOcean account with billing set up
- MongoDB database (either on DigitalOcean or elsewhere)
- GitHub repository with backend code

## Deployment Steps

### 1. Database Setup

1. Create a MongoDB database
   - On DigitalOcean: Databases > Create Database > MongoDB
   - Choose a plan that fits your needs
   - Set up a database user and password
   - Get the connection string

2. Test the connection locally:
   ```bash
   # Set your MongoDB URI in .env
   python test_mongodb_connection.py
   ```

### 2. Environment Variables

Set the following environment variables in the DigitalOcean App Platform:

```
MONGODB_URI=mongodb+srv://username:password@your-mongodb-host/database?options
SECRET_KEY=your_secure_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_USER_ID=your_user_id
EMAILJS_TEMPLATE_ID_PASSWORD_RESET=your_template_id
EMAILJS_TEMPLATE_ID_OTP=your_template_id
EMAILJS_TEMPLATE_ID_WELCOME=your_template_id
```

### 3. App Platform Configuration

1. On DigitalOcean dashboard, go to Apps > Create App
2. Connect your GitHub repository
3. Configure the app:
   - Source Directory: `/backend`
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from step 2
5. Set up health check:
   - HTTP Path: `/health`
   - Port: Default (assigned by DigitalOcean)
   - Initial Delay: 30 seconds
   - Period: 10 seconds

### 4. Post-Deployment Verification

Test the following endpoints:

1. Health check: `https://your-app-url/health`
2. API documentation: `https://your-app-url/docs`
3. API redoc: `https://your-app-url/redoc`

### 5. Troubleshooting

- Check app logs in DigitalOcean dashboard
- Verify MongoDB connection string is correct
- Ensure environment variables are set
- Check for CORS issues if frontend cannot connect

## Scaling and Monitoring

- Monitor app performance in DigitalOcean dashboard
- Scale horizontally by increasing the number of instances
- Set up alerts for high CPU/memory usage