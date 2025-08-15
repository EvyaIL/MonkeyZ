# Email Service Configuration Guide

To enable email notifications for order completion and admin notifications, set these environment variables:

## Gmail Configuration (Recommended)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-gmail@gmail.com
```

## How to get Gmail App Password:
1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > 2-Step Verification > App passwords
4. Generate an app password for "Mail"
5. Use this app password (not your regular password)

## Other SMTP Providers
### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=your-email@outlook.com
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@yahoo.com
```

## Current Status
- Admin notifications will be sent to: evyatarhypixel1477@gmail.com
- Customer emails will include formatted product keys
- Email service gracefully handles missing configuration
