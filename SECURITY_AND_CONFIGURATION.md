# Security and Configuration Guide

## Environment Variables

This project uses environment variables for all sensitive configuration. Below is a guide for setting up the required variables.

### Frontend (.env)

```env
# EmailJS Configuration
REACT_APP_EMAILJS_PUBLIC_KEY=your_public_key
REACT_APP_EMAILJS_SERVICE_ID=your_service_id

# EmailJS Templates
REACT_APP_EMAILJS_RESET_TEMPLATE=your_reset_template_id
REACT_APP_EMAILJS_OTP_TEMPLATE=your_otp_template_id
REACT_APP_EMAILJS_WELCOME_TEMPLATE=your_welcome_template_id
REACT_APP_EMAILJS_ORDER_TEMPLATE=your_order_template_id

# Grow Payment Integration
REACT_APP_GROW_USER_ID=your_grow_user_id
REACT_APP_GROW_PAGE_CODE=your_grow_page_code

# API Configuration
REACT_APP_PATH_BACKEND=http://localhost:8000

# Payment Redirects
REACT_APP_PAYMENT_FAIL_URL=http://localhost:3000/fail
REACT_APP_PAYMENT_SUCCESS_URL=http://localhost:3000/success
```

### Backend (.env)

```env
# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_USER_ID=your_user_id
EMAILJS_PRIVATE_KEY=your_private_key

# EmailJS Templates
EMAILJS_TEMPLATE_ID_AUTO_REPLY=your_auto_reply_template_id
EMAILJS_TEMPLATE_ID_CONTACT_US=your_contact_us_template_id
EMAILJS_TEMPLATE_ID_OTP=your_otp_template_id
EMAILJS_TEMPLATE_ID_PASSWORD_RESET=your_password_reset_template_id
EMAILJS_TEMPLATE_ID_WELCOME=your_welcome_template_id

# Grow Payment Integration
GROW_API_KEY=your_grow_api_key

# Other Configuration
SECRET_KEY=your_secure_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Security Best Practices

1. Never commit .env files to version control
2. Use different values for development and production
3. Regularly rotate sensitive credentials
4. Use strong, unique values for each environment
5. Limit access to production credentials
6. Monitor for unauthorized access or unusual activity

## Deployment

When deploying to production:

1. Use a secure secrets management system
2. Set up proper access controls
3. Enable audit logging for sensitive operations
4. Regularly review access logs
5. Configure rate limiting for payment endpoints
6. Implement proper error handling without exposing sensitive details

## Testing

For development and testing:

1. Use the sandbox environment for payment integration
2. Create test templates for EmailJS
3. Use test API keys with limited permissions
4. Implement proper error handling
5. Validate all inputs before sending to external services

Remember to replace all placeholder values with actual credentials before deploying.
