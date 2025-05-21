# Credentials Setup Guide

## Grow Payment Integration

The Grow payment integration requires sensitive credentials that should NEVER be committed to version control or hardcoded in the application.

### Required Environment Variables

#### Backend (.env)
```
GROW_USER_ID=your_user_id_here
GROW_PAGE_CODE=your_page_code_here
```

#### Frontend (.env)
```
REACT_APP_GROW_USER_ID=your_user_id_here
REACT_APP_GROW_PAGE_CODE=your_page_code_here
```

### Security Best Practices

1. Never commit real credentials to version control
2. Use different credentials for development and production
3. Store credentials securely in your deployment platform's environment variables
4. Regularly rotate credentials
5. Monitor for any unauthorized access or unusual activity

### Setting Up Development Environment

1. Create a copy of `.env.example` as `.env`
2. Contact the system administrator for the appropriate credentials
3. Add the credentials to your local `.env` file
4. Add `.env` to your `.gitignore` file

### Production Deployment

1. Set up environment variables in your deployment platform (e.g., DigitalOcean App Platform)
2. Use secure secrets management for storing credentials
3. Restrict access to environment variables to authorized personnel only
4. Implement proper logging and monitoring
