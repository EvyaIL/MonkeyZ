# MonkeyZ Email System Documentation

## 📧 Overview

MonkeyZ has transitioned from EmailJS to a self-hosted SMTP email system, providing cost-effective email functionality for:
- Contact form submissions
- OTP (One-Time Password) verification
- Password reset emails
- Welcome emails
- Auto-reply messages

## 🚀 Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env` and configure your SMTP settings:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@monkeyz.co.il
```

### 2. Gmail Setup (Recommended)
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail" application
   - Use this password in `SMTP_PASS`

### 3. Test Your Configuration
```bash
cd backend
python test_email_service.py
```

## 📋 Email Templates

### Contact Form Email
- **Purpose**: Notifies admins of new contact form submissions
- **Recipient**: Admin email (configured in environment)
- **Includes**: Customer name, email, message, timestamp

### Auto-Reply Email
- **Purpose**: Confirms receipt of contact form to customer
- **Recipient**: Customer who submitted form
- **Content**: Thank you message with contact information

### OTP Email
- **Purpose**: Sends verification codes for email verification
- **Recipient**: User requesting verification
- **Content**: 6-digit code valid for 10 minutes

### Password Reset Email
- **Purpose**: Provides secure link for password reset
- **Recipient**: User requesting password reset
- **Content**: Secure JWT token link with expiration

### Welcome Email
- **Purpose**: Welcomes new users after registration
- **Recipient**: Newly registered users
- **Content**: Welcome message and getting started information

## 🔧 API Endpoints

### Contact Form
```
POST /contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I need help with..."
}
```

### OTP Request
```
POST /api/users/request-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### OTP Verification
```
POST /api/users/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

## 🛠️ Testing

### Email Service Test
```bash
cd backend
python test_email_service.py
```
This will test all email templates and SMTP connectivity.

### API Endpoints Test
```bash
cd backend
python test_endpoints.py
```
This will test OTP and contact form endpoints.

### Manual Testing
1. **Contact Form**: Submit a form through the frontend
2. **OTP Flow**: Request OTP → Receive email → Verify code
3. **Password Reset**: Request reset → Check email → Follow link

## 🔍 Troubleshooting

### Common Issues

#### "Authentication failed"
- **Cause**: Incorrect SMTP credentials
- **Solution**: Verify username/password, use App Password for Gmail

#### "Connection refused"
- **Cause**: Firewall or incorrect SMTP settings
- **Solution**: Check SMTP host/port, disable firewall temporarily

#### "Emails not received"
- **Cause**: Spam filter or delivery issues
- **Solution**: Check spam folder, verify recipient email

#### "OTP expired"
- **Cause**: OTP codes expire after 10 minutes
- **Solution**: Request a new OTP code

### Debug Steps
1. Run `python test_email_service.py` to verify SMTP
2. Check backend logs for error messages
3. Verify environment variables are loaded
4. Test with different email providers

## 📁 File Structure

```
backend/
├── src/lib/email_service.py          # Main email service
├── src/routers/users_router.py       # OTP endpoints
├── main.py                           # Contact form endpoint
├── test_email_service.py             # Email testing script
├── test_endpoints.py                 # API testing script
└── .env.example                      # Environment template
```

## 🔒 Security Features

- **App Passwords**: Use Gmail App Passwords instead of account password
- **JWT Tokens**: Password reset links use secure JWT tokens
- **OTP Expiration**: OTP codes expire after 10 minutes
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Input Validation**: All email inputs are validated

## 🌐 Frontend Integration

### Contact Form (Contact.jsx)
- Uses JSON API instead of FormData
- Handles success/error states
- Provides user feedback

### OTP Integration
- Request OTP for email verification
- Verify OTP code with backend
- Handle expiration and retry logic

## 📊 Monitoring

### Email Logs
Check `backend/logs/monkeyz.log` for email activity:
- Successful email sends
- SMTP connection issues
- Template rendering errors

### Error Handling
All email functions return boolean success status:
```python
success = send_contact_email(email, name, message)
if not success:
    # Handle email failure
```

## 🔮 Future Enhancements

1. **Email Templates**: HTML templates with styling
2. **Attachments**: Support for file attachments
3. **Email Queue**: Background job processing
4. **Analytics**: Track email open/click rates
5. **Multi-language**: Template translations

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the test scripts to identify problems
3. Review backend logs for error details
4. Verify environment configuration

The email system is designed to be reliable, secure, and cost-effective, replacing the expensive EmailJS service while maintaining all functionality.
