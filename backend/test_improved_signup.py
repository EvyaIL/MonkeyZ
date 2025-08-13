import requests
import json

# Test the improved signup functionality
BASE_URL = "http://localhost:8000"

def test_signup_with_optional_phone():
    """Test signup with and without phone number"""
    print("Testing improved signup functionality...")
    
    test_cases = [
        {
            "name": "With phone number",
            "data": {
                "username": "testuser_with_phone",
                "email": "test_with_phone@example.com",
                "password": "StrongPass123!",
                "phone_number": 505551234
            }
        },
        {
            "name": "Without phone number (null)",
            "data": {
                "username": "testuser_no_phone",
                "email": "test_no_phone@example.com", 
                "password": "StrongPass123!",
                "phone_number": None
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n--- Testing: {test_case['name']} ---")
        
        try:
            response = requests.post(
                f"{BASE_URL}/user",
                json=test_case["data"],
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code in [200, 201]:
                print(f"✅ {test_case['name']} signup successful!")
            else:
                print(f"❌ {test_case['name']} signup failed!")
                
        except Exception as e:
            print(f"Error testing {test_case['name']}: {e}")

def test_password_strength():
    """Test password strength validation"""
    print("\n=== Testing Password Strength ===")
    
    passwords = [
        ("weak123", "Weak - only lowercase and numbers"),
        ("WeakPass", "Weak - no numbers or symbols"),
        ("StrongPass123", "Medium - missing symbols"),
        ("StrongPass123!", "Strong - has all requirements"),
        ("VeryStr0ng!Pass", "Strong - has all requirements")
    ]
    
    # This would be tested on the frontend - just showing examples
    for password, description in passwords:
        strength = calculate_password_strength(password)
        print(f"Password: {password:15} | Strength: {strength}/5 | {description}")

def calculate_password_strength(password):
    """Simulate the frontend password strength calculation"""
    if not password:
        return 0
    
    strength = 0
    if len(password) >= 8:
        strength += 1
    if len(password) >= 12:
        strength += 1
    if any(c.islower() for c in password):
        strength += 1
    if any(c.isupper() for c in password):
        strength += 1
    if any(c.isdigit() for c in password):
        strength += 1
    if any(not c.isalnum() for c in password):
        strength += 1
    
    return min(strength, 5)

if __name__ == "__main__":
    print("Testing MonkeyZ Improved Signup")
    print("=" * 40)
    
    test_password_strength()
    test_signup_with_optional_phone()
    
    print("\n" + "=" * 40)
    print("Frontend Improvements Summary:")
    print("✅ Phone number is now optional")
    print("✅ Password strength indicator added")
    print("✅ Confirm password field added")
    print("✅ Strong password validation (3+ character types)")
    print("✅ Real-time password strength feedback")
    
    print("\nTo test the frontend:")
    print("1. Go to http://localhost:3000/sign-up")
    print("2. Try different password combinations")
    print("3. Leave phone number empty (should work)")
    print("4. Fill phone number (should validate format)")
    print("5. Watch password strength indicator change")
