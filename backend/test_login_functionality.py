import requests
import json

# Test the login endpoint with both username and email
BASE_URL = "http://localhost:8000"

def test_login_with_username():
    """Test login with username"""
    print("Testing login with username...")
    data = {
        "username": "testuser",  # Replace with an actual username from your database
        "password": "testpassword123"  # Replace with the actual password
    }
    
    response = requests.post(
        f"{BASE_URL}/user/login",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"Username Login - Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Username login successful!")
        print(f"Response: {response.json()}")
    else:
        print("❌ Username login failed!")
        print(f"Error: {response.text}")
    print("-" * 50)

def test_login_with_email():
    """Test login with email"""
    print("Testing login with email...")
    data = {
        "username": "test@example.com",  # Replace with an actual email from your database
        "password": "testpassword123"    # Replace with the actual password
    }
    
    response = requests.post(
        f"{BASE_URL}/user/login",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"Email Login - Status Code: {response.status_code}")
    if response.status_code == 200:
        print("✅ Email login successful!")
        print(f"Response: {response.json()}")
    else:
        print("❌ Email login failed!")
        print(f"Error: {response.text}")
    print("-" * 50)

def get_users_list():
    """Get list of users to see what usernames/emails are available for testing"""
    print("Getting users list for reference...")
    try:
        response = requests.get(f"{BASE_URL}/user/all")
        if response.status_code == 200:
            users = response.json()
            print("Available users:")
            for user in users[:3]:  # Show first 3 users
                print(f"  Username: {user.get('username', 'N/A')}, Email: {user.get('email', 'N/A')}")
        else:
            print(f"Failed to get users: {response.status_code}")
    except Exception as e:
        print(f"Error getting users: {e}")
    print("-" * 50)

if __name__ == "__main__":
    print("Testing MonkeyZ Login Functionality")
    print("=" * 50)
    
    # First, get some user info for reference
    get_users_list()
    
    # Test with username
    test_login_with_username()
    
    # Test with email
    test_login_with_email()
    
    print("\nNote: Update the username/email and password in this script with actual user credentials from your database.")
