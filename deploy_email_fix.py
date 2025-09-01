#!/usr/bin/env python3
"""
Production Email Fix Deployment Script

This script helps you deploy the email fix to DigitalOcean and set up proper environment variables.
"""

import os

def show_email_fix_summary():
    """Show what the email fix does."""
    print("🚀 MonkeyZ Production Email Fix")
    print("=" * 40)
    
    print("\n🔍 Problem Identified:")
    print("   ❌ Environment variable mismatch between email service and production config")
    print("   ❌ Email service expected: SMTP_USER, SMTP_PASS, SMTP_HOST, etc.")
    print("   ❌ Production docker-compose set: MAIL_USERNAME, MAIL_PASSWORD, MAIL_SERVER, etc.")
    
    print("\n🔧 Fix Applied:")
    print("   ✅ Updated email_service.py to support both variable naming conventions")
    print("   ✅ Added backward compatibility for existing SMTP_* variables")
    print("   ✅ Enhanced logging to show which credentials are being used")

def show_deployment_steps():
    """Show the deployment steps."""
    print("\n📋 Deployment Steps for DigitalOcean")
    print("=" * 40)
    
    print("\n1️⃣ Upload Fixed Email Service")
    print("   📁 File to upload: backend/src/services/email_service.py")
    print("   📍 Upload to: /path/to/your/app/backend/src/services/email_service.py")
    
    print("\n   Using SCP:")
    print("   scp backend/src/services/email_service.py user@your-server:/path/to/app/backend/src/services/")
    
    print("\n2️⃣ Set Environment Variables")
    print("   Create/update your .env file on the server with:")
    print("""
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-gmail-app-password
   MAIL_FROM=support@monkeyz.co.il  
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   ADMIN_EMAIL=support@monkeyz.co.il
   """)
    
    print("\n3️⃣ Gmail App Password Setup (if not done)")
    print("   🔐 Gmail → Security → 2-Step Verification → App passwords")
    print("   📝 Generate app password for 'Mail'")
    print("   💾 Use this password (not your regular Gmail password)")
    
    print("\n4️⃣ Restart Your Application")
    print("   Choose your deployment method:")
    
    print("\n   🐳 Docker Deployment:")
    print("      cd /path/to/your/app")
    print("      docker-compose -f docker-compose.prod.yml down")
    print("      docker-compose -f docker-compose.prod.yml build backend")
    print("      docker-compose -f docker-compose.prod.yml up -d")
    
    print("\n   🐍 Direct Python:")
    print("      pkill -f uvicorn")
    print("      cd /path/to/your/app/backend")
    print("      uvicorn main:app --host 0.0.0.0 --port 8000 &")

def create_env_template():
    """Create a template .env file."""
    env_content = """# MonkeyZ Production Environment Variables
# Email Configuration (Required for order confirmations)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=support@monkeyz.co.il
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
ADMIN_EMAIL=support@monkeyz.co.il

# Database
MONGODB_URI=mongodb://your-mongodb-connection-string
MONGODB_DB_NAME=monkeyz_production

# Security
JWT_SECRET=your-super-secure-jwt-secret

# PayPal (Production)
PAYPAL_CLIENT_ID=your-paypal-live-client-id
PAYPAL_CLIENT_SECRET=your-paypal-live-secret
PAYPAL_MODE=live

# CORS
FRONTEND_URL=https://your-domain.com
"""
    
    with open(".env.production.template", "w") as f:
        f.write(env_content)
    
    print(f"\n📝 Created .env.production.template")
    print(f"   Copy this to your server as .env and fill in your actual values")

def show_testing_steps():
    """Show how to test email after deployment."""
    print("\n🧪 Testing Email After Deployment")
    print("=" * 40)
    
    print("\n1️⃣ Check Backend Logs")
    print("   Look for these log messages:")
    print("   ✅ 'Email service enabled - SMTP: smtp.gmail.com:587'")
    print("   ❌ 'Email service disabled - missing MAIL_USERNAME/MAIL_PASSWORD'")
    
    print("\n2️⃣ Test Order Flow")
    print("   🛒 Place a test order on your production site")
    print("   📧 Check if order confirmation email arrives")
    print("   📝 Check spam folder if not in inbox")
    
    print("\n3️⃣ Check Email Service Status")
    print("   📋 Upload and run test_email_production.py on your server")
    print("   🔍 It will show exactly what's configured and test sending")
    
    print("\n4️⃣ Common Issues & Solutions")
    print("   🚫 Port 25 blocked → Use port 587 (already configured)")
    print("   🔑 Gmail login fails → Use App Password, not regular password")
    print("   🔥 Firewall issues → Allow outbound SMTP (port 587)")
    print("   🏢 Corporate email → May need different SMTP settings")

def main():
    print("📧 MonkeyZ Email Fix - Production Deployment Guide")
    print("=" * 60)
    
    show_email_fix_summary()
    show_deployment_steps()
    create_env_template()
    show_testing_steps()
    
    print(f"\n🎯 Summary")
    print("=" * 20)
    print("✅ Email service code fixed (supports both MAIL_* and SMTP_* variables)")
    print("✅ Environment template created")
    print("✅ Deployment steps provided")
    
    print(f"\n🚀 Next Steps:")
    print("1. Upload the fixed email_service.py to your server")
    print("2. Set up environment variables (use the template)")
    print("3. Restart your backend application")
    print("4. Test order flow - emails should work!")
    
    print(f"\n💡 After deployment, your production emails will work just like localhost!")

if __name__ == "__main__":
    main()
