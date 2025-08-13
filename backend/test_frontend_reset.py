import requests
import json

# Test the password reset endpoint directly to make sure backend is working
BASE_URL = "http://localhost:8000"

def test_password_reset_endpoint():
    """Test the password reset endpoint directly"""
    print("Testing password reset endpoint...")
    
    # Test with a valid email format
    test_email = "test@example.com"  # Replace with an actual email from your database
    
    try:
        response = requests.post(
            f"{BASE_URL}/user/password-reset/request",
            json={"email": test_email},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Backend password reset endpoint is working!")
        else:
            print("❌ Backend password reset endpoint failed!")
            
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        print("Make sure the backend server is running on http://localhost:8000")

def test_with_existing_user_email():
    """Test with an email that exists in the database"""
    print("\nTesting with existing user email...")
    
    # First get a user email from the database
    try:
        users_response = requests.get(f"{BASE_URL}/user/all")
        if users_response.status_code == 200:
            users = users_response.json()
            if users:
                test_email = users[0].get("email")
                print(f"Testing with existing email: {test_email}")
                
                response = requests.post(
                    f"{BASE_URL}/user/password-reset/request",
                    json={"email": test_email},
                    headers={"Content-Type": "application/json"}
                )
                
                print(f"Status Code: {response.status_code}")
                print(f"Response: {response.text}")
                
                if response.status_code == 200:
                    print("✅ Password reset with existing email works!")
                else:
                    print("❌ Password reset with existing email failed!")
            else:
                print("No users found in database")
        else:
            print(f"Failed to get users: {users_response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Testing MonkeyZ Password Reset")
    print("=" * 40)
    
    test_password_reset_endpoint()
    test_with_existing_user_email()
    
    print("\nIf backend tests pass but frontend doesn't work:")
    print("1. Check browser console for errors")
    print("2. Check network tab in browser dev tools")
    print("3. Make sure frontend is running on http://localhost:3000")
    print("4. Make sure backend is running on http://localhost:8000")
