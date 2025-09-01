#!/usr/bin/env python3
"""
Email Configuration Test Script

This script helps diagnose email issues in production by:
1. Testing email configuration 
2. Sending a test email
3. Providing troubleshooting steps
"""

import os
import sys
import asyncio
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
if backend_path.exists():
    sys.path.insert(0, str(backend_path))

async def test_email_config():
    """Test email configuration and send a test email."""
    
    print("📧 Email Configuration Test")
    print("=" * 40)
    
    # Check environment variables
    print("\n🔍 Checking Environment Variables:")
    
    email_vars = {
        "MAIL_USERNAME": os.getenv("MAIL_USERNAME"),
        "MAIL_PASSWORD": os.getenv("MAIL_PASSWORD"), 
        "MAIL_FROM": os.getenv("MAIL_FROM"),
        "MAIL_SERVER": os.getenv("MAIL_SERVER"),
        "MAIL_PORT": os.getenv("MAIL_PORT"),
        # Legacy variables
        "SMTP_USER": os.getenv("SMTP_USER"),
        "SMTP_PASS": os.getenv("SMTP_PASS"),
        "SMTP_FROM": os.getenv("SMTP_FROM"),
        "SMTP_HOST": os.getenv("SMTP_HOST"),
        "SMTP_PORT": os.getenv("SMTP_PORT")
    }
    
    for var, value in email_vars.items():
        if value:
            if "PASS" in var:
                display_value = "*" * len(str(value))
            else:
                display_value = value
            print(f"   ✅ {var}: {display_value}")
        else:
            print(f"   ❌ {var}: Not set")
    
    # Determine which variables are being used
    using_mail_vars = bool(email_vars["MAIL_USERNAME"] and email_vars["MAIL_PASSWORD"])
    using_smtp_vars = bool(email_vars["SMTP_USER"] and email_vars["SMTP_PASS"])
    
    print(f"\n📊 Configuration Status:")
    print(f"   MAIL_* variables: {'✅ Available' if using_mail_vars else '❌ Missing'}")
    print(f"   SMTP_* variables: {'✅ Available' if using_smtp_vars else '❌ Missing'}")
    
    if not using_mail_vars and not using_smtp_vars:
        print(f"\n❌ No email credentials found!")
        print(f"   Set either MAIL_USERNAME/MAIL_PASSWORD or SMTP_USER/SMTP_PASS")
        return False
    
    # Try to import and test the email service
    try:
        from src.services.email_service import EmailService, EMAIL_ENABLED, conf
        
        print(f"\n🔧 Email Service Status:")
        print(f"   Enabled: {'✅ Yes' if EMAIL_ENABLED else '❌ No'}")
        
        if conf:
            print(f"   Server: {conf.MAIL_SERVER}:{conf.MAIL_PORT}")
            print(f"   From: {conf.MAIL_FROM}")
            print(f"   Username: {conf.MAIL_USERNAME}")
            print(f"   STARTTLS: {conf.MAIL_STARTTLS}")
        
        if not EMAIL_ENABLED:
            print(f"   ❌ Email service is disabled")
            return False
        
        # Test sending an email
        print(f"\n🧪 Testing Email Send...")
        
        test_email = input("Enter test email address (or press Enter to skip): ").strip()
        if not test_email:
            print("   ⏭️ Skipping email test")
            return True
        
        email_service = EmailService()
        
        # Send test email
        success = await email_service.send_order_email(
            to=test_email,
            subject="MonkeyZ Email Test - Configuration Working!",
            products=[{"name": "Test Product", "id": "test-123"}],
            keys=["TEST-KEY-12345", "TEST-KEY-67890"]
        )
        
        if success:
            print(f"   ✅ Test email sent successfully to {test_email}")
            print(f"   Check your inbox for the test email")
            return True
        else:
            print(f"   ❌ Failed to send test email")
            return False
        
    except ImportError as e:
        print(f"   ❌ Could not import email service: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Email service error: {e}")
        return False

def show_production_troubleshooting():
    """Show troubleshooting steps for production email issues."""
    
    print(f"\n🚨 Production Email Troubleshooting")
    print("=" * 40)
    
    print(f"\n1️⃣ Environment Variable Issues:")
    print(f"   • Make sure MAIL_USERNAME and MAIL_PASSWORD are set in production")
    print(f"   • Check your .env file or docker-compose environment section")
    print(f"   • Verify variable names match exactly (case sensitive)")
    
    print(f"\n2️⃣ Gmail App Password Issues:")
    print(f"   • Use Gmail App Password, not regular password")
    print(f"   • Enable 2-Factor Authentication on Gmail")
    print(f"   • Generate App Password: Gmail → Security → 2-Step Verification → App passwords")
    
    print(f"\n3️⃣ SMTP Server Issues:")
    print(f"   • Gmail SMTP: smtp.gmail.com:587")
    print(f"   • Make sure STARTTLS is enabled")
    print(f"   • Check firewall settings on your server")
    
    print(f"\n4️⃣ Digital Ocean Specific Issues:")
    print(f"   • Some cloud providers block port 25")
    print(f"   • Use port 587 (STARTTLS) or 465 (SSL)")
    print(f"   • Check Digital Ocean's SMTP policies")
    
    print(f"\n5️⃣ Debugging Steps:")
    print(f"   • Check backend logs for email errors")
    print(f"   • Test SMTP connection manually:")
    print(f"     telnet smtp.gmail.com 587")
    print(f"   • Verify DNS resolution on your server")
    
    print(f"\n6️⃣ Environment Variable Setup for Production:")
    print(f"   Add to your .env file or docker-compose.yml:")
    print(f"   MAIL_USERNAME=your-email@gmail.com")
    print(f"   MAIL_PASSWORD=your-app-password")
    print(f"   MAIL_FROM=support@monkeyz.co.il")
    print(f"   MAIL_SERVER=smtp.gmail.com")
    print(f"   MAIL_PORT=587")

def show_docker_compose_fix():
    """Show the corrected docker-compose configuration."""
    
    print(f"\n🐳 Docker Compose Email Configuration")
    print("=" * 40)
    
    print(f"Add these environment variables to your docker-compose.prod.yml:")
    print(f"""
    environment:
      # Email Service (Updated - Working Configuration)
      - MAIL_USERNAME=${{MAIL_USERNAME}}
      - MAIL_PASSWORD=${{MAIL_PASSWORD}}
      - MAIL_FROM=${{MAIL_FROM:-support@monkeyz.co.il}}
      - MAIL_SERVER=${{MAIL_SERVER:-smtp.gmail.com}}
      - MAIL_PORT=${{MAIL_PORT:-587}}
      - ADMIN_EMAIL=${{ADMIN_EMAIL:-support@monkeyz.co.il}}
    """)
    
    print(f"Create a .env file with your actual credentials:")
    print(f"""
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
MAIL_FROM=support@monkeyz.co.il
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
ADMIN_EMAIL=support@monkeyz.co.il
    """)

async def main():
    print("🚀 MonkeyZ Email Configuration Diagnostic Tool")
    print("=" * 50)
    
    # Test current configuration
    email_working = await test_email_config()
    
    if email_working:
        print(f"\n🎉 Email configuration is working correctly!")
        print(f"   Your production emails should work now.")
    else:
        print(f"\n❌ Email configuration has issues")
        
        # Show troubleshooting
        show_production_troubleshooting()
        show_docker_compose_fix()
        
        print(f"\n📋 Quick Fix Steps:")
        print(f"1. Update your email service (already done)")
        print(f"2. Set correct environment variables in production")
        print(f"3. Restart your backend service")
        print(f"4. Test again with this script")
    
    print(f"\n💡 Note: The email service has been updated to support both")
    print(f"   MAIL_* and SMTP_* environment variable names for compatibility.")

if __name__ == "__main__":
    asyncio.run(main())
