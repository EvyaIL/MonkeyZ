#!/usr/bin/env python3
"""
Test script for SMTP email functionality
Run this script to test your email configuration before using it in the application
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.lib.email_service import (
    send_contact_email, 
    send_auto_reply_email, 
    send_password_reset_email, 
    send_otp_email,
    send_welcome_email
)

def test_email_service():
    print("🧪 Testing MonkeyZ Email Service (SMTP)")
    print("=" * 50)
    
    # Check if environment variables are set
    required_vars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n📋 Please set these variables in your .env file")
        print("📖 See .env.example for configuration instructions")
        return False
    
    print("✅ Environment variables configured")
    
    # Test email address (change this to your test email)
    test_email = input("Enter your test email address: ").strip()
    if not test_email:
        print("❌ No email address provided")
        return False
    
    print(f"📧 Testing email functionality with: {test_email}")
    print()
    
    # Test 1: Contact form email
    print("1️⃣ Testing contact form email...")
    try:
        success = send_contact_email(
            to_email=test_email,
            name="Test User",
            message="This is a test contact form submission from MonkeyZ email service."
        )
        if success:
            print("   ✅ Contact email sent successfully")
        else:
            print("   ❌ Contact email failed")
    except Exception as e:
        print(f"   ❌ Contact email error: {e}")
    
    # Test 2: Auto-reply email
    print("2️⃣ Testing auto-reply email...")
    try:
        success = send_auto_reply_email(
            to_email=test_email,
            subject="Thank you for contacting MonkeyZ!",
            message="Thank you for your message! We'll get back to you soon."
        )
        if success:
            print("   ✅ Auto-reply email sent successfully")
        else:
            print("   ❌ Auto-reply email failed")
    except Exception as e:
        print(f"   ❌ Auto-reply email error: {e}")
    
    # Test 3: Password reset email
    print("3️⃣ Testing password reset email...")
    try:
        success = send_password_reset_email(
            to_email=test_email,
            reset_link="https://monkeyz.co.il/reset-password?token=test123"
        )
        if success:
            print("   ✅ Password reset email sent successfully")
        else:
            print("   ❌ Password reset email failed")
    except Exception as e:
        print(f"   ❌ Password reset email error: {e}")
    
    # Test 4: OTP email
    print("4️⃣ Testing OTP email...")
    try:
        success = send_otp_email(
            to_email=test_email,
            otp="123456"
        )
        if success:
            print("   ✅ OTP email sent successfully")
        else:
            print("   ❌ OTP email failed")
    except Exception as e:
        print(f"   ❌ OTP email error: {e}")
    
    # Test 5: Welcome email
    print("5️⃣ Testing welcome email...")
    try:
        success = send_welcome_email(
            to_email=test_email,
            username="Test User"
        )
        if success:
            print("   ✅ Welcome email sent successfully")
        else:
            print("   ❌ Welcome email failed")
    except Exception as e:
        print(f"   ❌ Welcome email error: {e}")
    
    print()
    print("🎉 Email testing completed!")
    print("📬 Check your inbox for test emails")
    print()
    print("💡 If emails failed:")
    print("   1. Check your SMTP credentials in .env")
    print("   2. Ensure 2FA and App Password for Gmail")
    print("   3. Check firewall/antivirus settings")
    print("   4. Verify SMTP server settings")

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    test_email_service()
