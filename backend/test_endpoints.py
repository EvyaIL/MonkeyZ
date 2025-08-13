#!/usr/bin/env python3
"""
Test script for OTP functionality
This tests the OTP request and verify endpoints
"""

import requests
import json
import time

def test_otp_functionality():
    print("🔐 Testing MonkeyZ OTP Functionality")
    print("=" * 40)
    
    base_url = "http://localhost:5000"  # Adjust if your backend runs on different port
    
    # Test email
    test_email = input("Enter your email for OTP testing: ").strip()
    if not test_email:
        print("❌ No email provided")
        return
    
    print(f"📧 Testing OTP with email: {test_email}")
    print()
    
    # Test 1: Request OTP
    print("1️⃣ Requesting OTP...")
    try:
        response = requests.post(
            f"{base_url}/api/users/request-otp",
            json={"email": test_email}
        )
        
        if response.status_code == 200:
            print("   ✅ OTP request successful")
            print(f"   📧 Check your email for the OTP code")
        else:
            print(f"   ❌ OTP request failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to backend server")
        print("   💡 Make sure your backend is running on http://localhost:5000")
        return
    except Exception as e:
        print(f"   ❌ OTP request error: {e}")
        return
    
    # Wait for user to receive email
    print()
    otp_code = input("Enter the OTP code you received via email: ").strip()
    if not otp_code:
        print("❌ No OTP code provided")
        return
    
    # Test 2: Verify OTP
    print("2️⃣ Verifying OTP...")
    try:
        response = requests.post(
            f"{base_url}/api/users/verify-otp",
            json={
                "email": test_email,
                "otp": otp_code
            }
        )
        
        if response.status_code == 200:
            print("   ✅ OTP verification successful")
            result = response.json()
            print(f"   📝 Response: {result.get('message', 'Verified')}")
        else:
            print(f"   ❌ OTP verification failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ OTP verification error: {e}")
    
    print()
    print("🎉 OTP testing completed!")

def test_contact_form():
    print("📬 Testing Contact Form")
    print("=" * 25)
    
    base_url = "http://localhost:5000"
    
    print("Testing contact form submission...")
    try:
        response = requests.post(
            f"{base_url}/contact",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "message": "This is a test message from the contact form test script."
            }
        )
        
        if response.status_code == 200:
            print("   ✅ Contact form submission successful")
            result = response.json()
            print(f"   📝 Response: {result.get('message', 'Sent')}")
        else:
            print(f"   ❌ Contact form submission failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to backend server")
        print("   💡 Make sure your backend is running on http://localhost:5000")
    except Exception as e:
        print(f"   ❌ Contact form error: {e}")

if __name__ == "__main__":
    print("Choose test to run:")
    print("1. OTP functionality")
    print("2. Contact form")
    print("3. Both")
    
    choice = input("Enter your choice (1-3): ").strip()
    
    if choice == "1":
        test_otp_functionality()
    elif choice == "2":
        test_contact_form()
    elif choice == "3":
        test_contact_form()
        print("\n" + "="*50 + "\n")
        test_otp_functionality()
    else:
        print("Invalid choice")
