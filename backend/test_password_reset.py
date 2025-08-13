#!/usr/bin/env python3
"""
Test script for password reset functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from src.lib.email_service import send_password_reset_email

def test_password_reset_email():
    print("Testing Password Reset Email Service...")
    
    # Check environment variables
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    print(f"SMTP Host: {smtp_host}")
    print(f"SMTP User: {smtp_user}")
    print(f"SMTP Pass: {'*' * len(smtp_pass) if smtp_pass else 'Not set'}")
    print(f"Frontend URL: {frontend_url}")
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        print("❌ SMTP credentials not configured properly")
        return False
    
    # Test email
    test_email = input("Enter your email to test password reset: ").strip()
    if not test_email:
        print("❌ No email provided")
        return False
    
    # Create a test reset link
    test_token = "test_token_123456"
    reset_link = f"{frontend_url}/reset-password?token={test_token}"
    
    print(f"Sending password reset email to: {test_email}")
    print(f"Reset link: {reset_link}")
    
    # Send test password reset email
    result = send_password_reset_email(test_email, reset_link)
    
    if result:
        print("✅ Password reset email sent successfully!")
        print("📧 Check your email for the reset link")
        return True
    else:
        print("❌ Failed to send password reset email")
        return False

if __name__ == "__main__":
    test_password_reset_email()
