import requests
import json

# Test the enhanced login system with multiple login methods
BASE_URL = "http://localhost:8000"

def test_google_signup_with_custom_username():
    """Test Google signup with custom username (this requires a real Google token)"""
    print("Testing Google signup with custom username...")
    print("Note: This test requires a real Google credential token")
    print("You can test this manually through the frontend")
    print("-" * 50)

def test_multiple_login_methods():
    """Test login with different methods for the same user"""
    print("Testing multiple login methods...")
    
    # This would test:
    # 1. Login with email
    # 2. Login with custom username 
    # 3. Login with Google name
    
    test_cases = [
        {
            "method": "email",
            "username": "test@example.com",
            "password": "testpassword123"
        },
        {
            "method": "custom username",
            "username": "customuser123",
            "password": "testpassword123"
        },
        {
            "method": "google name",
            "username": "John Doe",
            "password": "google-oauth"
        }
    ]
    
    for test_case in test_cases:
        print(f"Testing login with {test_case['method']}: {test_case['username']}")
        
        data = {
            "username": test_case["username"],
            "password": test_case["password"]
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/user/login",
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"  Status Code: {response.status_code}")
            if response.status_code == 200:
                print(f"  ✅ Login successful with {test_case['method']}!")
                result = response.json()
                print(f"  User: {result.get('user', {}).get('username', 'N/A')}")
            else:
                print(f"  ❌ Login failed with {test_case['method']}")
                print(f"  Error: {response.text}")
        except Exception as e:
            print(f"  Error testing {test_case['method']}: {e}")
        
        print("-" * 30)

def get_user_details():
    """Get a sample user to understand the data structure"""
    print("Getting user details for testing...")
    try:
        response = requests.get(f"{BASE_URL}/user/all")
        if response.status_code == 200:
            users = response.json()
            if users:
                user = users[0]
                print("Sample user structure:")
                print(f"  Username: {user.get('username', 'N/A')}")
                print(f"  Email: {user.get('email', 'N/A')}")
                print(f"  Google Name: {user.get('google_name', 'N/A')}")
                print(f"  Password: {'*' * len(user.get('password', '')) if user.get('password') else 'N/A'}")
            else:
                print("No users found in the database")
        else:
            print(f"Failed to get users: {response.status_code}")
    except Exception as e:
        print(f"Error getting user details: {e}")
    print("-" * 50)

if __name__ == "__main__":
    print("Testing Enhanced MonkeyZ Login System")
    print("=" * 50)
    
    # Get user details first
    get_user_details()
    
    # Test Google signup (manual test required)
    test_google_signup_with_custom_username()
    
    # Test multiple login methods
    test_multiple_login_methods()
    
    print("\nInstructions for manual testing:")
    print("1. Go to the signup page")
    print("2. Enter a custom username")
    print("3. Click 'Sign up with Google'")
    print("4. Try logging in with:")
    print("   - Your email address")
    print("   - Your custom username")
    print("   - Your Google display name")
    print("5. All three should work!")
