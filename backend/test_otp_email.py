#!/usr/bin/env python3
"""
Quick test for email service
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from src.lib.email_service import send_otp_email

def test_otp_email():
    print("Testing OTP email service...")
    
    # Check environment variables
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    
    print(f"SMTP Host: {smtp_host}")
    print(f"SMTP User: {smtp_user}")
    print(f"SMTP Pass: {'*' * len(smtp_pass) if smtp_pass else 'Not set'}")
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        print("❌ SMTP credentials not configured properly")
        return False
    
    # Test email
    test_email = input("Enter your email to test OTP: ").strip()
    if not test_email:
        print("❌ No email provided")
        return False
    
    # Send test OTP
    result = send_otp_email(test_email, "123456")
    
    if result:
        print("✅ OTP email sent successfully!")
        return True
    else:
        print("❌ Failed to send OTP email")
        return False

if __name__ == "__main__":
    test_otp_email()
