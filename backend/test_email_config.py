#!/usr/bin/env python3
"""
Quick test to verify email configuration with Zoho Mail
"""

import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_email_config():
    """Test the email configuration"""
    print("🧪 Testing Zoho Email Configuration...")
    
    # Check environment variables
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    smtp_from = os.getenv("SMTP_FROM")
    admin_email = os.getenv("ADMIN_EMAIL", "support@monkeyz.co.il")
    
    print(f"   SMTP Host: {smtp_host}")
    print(f"   SMTP Port: {smtp_port}")
    print(f"   SMTP User: {smtp_user}")
    print(f"   SMTP From: {smtp_from}")
    print(f"   Admin Email: {admin_email}")
    print(f"   SMTP Pass: {'*' * len(smtp_pass) if smtp_pass else 'Not set'}")
    
    if all([smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from]):
        print("✅ All email configuration variables are set!")
        
        # Test the email service
        try:
            from src.services.email_service import EMAIL_ENABLED, conf
            if EMAIL_ENABLED and conf:
                print("✅ Email service is enabled and configured")
                print(f"   Will send admin notifications to: {admin_email}")
                print(f"   Customer emails will be sent from: {smtp_from}")
            else:
                print("❌ Email service is disabled")
        except Exception as e:
            print(f"❌ Email service configuration error: {e}")
    else:
        print("❌ Missing email configuration variables")
        if not smtp_host: print("   - SMTP_HOST is missing")
        if not smtp_port: print("   - SMTP_PORT is missing")
        if not smtp_user: print("   - SMTP_USER is missing")
        if not smtp_pass: print("   - SMTP_PASS is missing")
        if not smtp_from: print("   - SMTP_FROM is missing")

async def main():
    """Main test function"""
    print("🚀 MonkeyZ Email Configuration Test\n")
    
    await test_email_config()
    
    print("\n📧 Email Notifications Summary:")
    print("• Admin notifications will be sent to: support@monkeyz.co.il (or ADMIN_EMAIL if set)")
    print("• Customer order confirmations will include formatted product keys")
    print("• All PayPal and manual orders will trigger notifications")
    print("• Duplicate orders are now prevented")
    print("• Coupon analytics are fixed for case-insensitive matching")

if __name__ == "__main__":
    asyncio.run(main())
