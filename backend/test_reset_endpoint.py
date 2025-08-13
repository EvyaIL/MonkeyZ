#!/usr/bin/env python3
"""
Test password reset endpoints
"""
import requests
import json

def test_password_reset_endpoints():
    base_url = "http://localhost:8000"
    
    print("🔐 Testing Password Reset Endpoints")
    print("=" * 40)
    
    # Test email
    test_email = input("Enter your email for password reset testing: ").strip()
    if not test_email:
        print("❌ No email provided")
        return
    
    print(f"📧 Testing password reset with email: {test_email}")
    print()
    
    # Test 1: Request password reset
    print("1️⃣ Requesting password reset...")
    try:
        response = requests.post(
            f"{base_url}/user/password-reset/request",
            json={"email": test_email},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ Password reset request successful")
            print("   📧 Check your email for the reset link")
        else:
            print(f"   ❌ Password reset request failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to backend server")
        print("   💡 Make sure your backend is running on http://localhost:8000")
        print("   💡 Run: python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000")
        return
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out")
        return
    except Exception as e:
        print(f"   ❌ Password reset request error: {e}")
        return
    
    print()
    print("🎉 Password reset endpoint testing completed!")

if __name__ == "__main__":
    test_password_reset_endpoints()
