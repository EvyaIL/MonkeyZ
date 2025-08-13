import requests
import json

# Test admin authentication and role
BASE_URL = "http://localhost:8000"

def test_admin_authentication():
    """Test current user authentication and admin privileges"""
    print("Testing admin authentication...")
    
    # First, try to get current user info to see their role
    try:
        # You'll need to get the actual token from localStorage in the browser
        # This is just for testing - replace with actual token
        token = "your_jwt_token_here"  # Get this from browser localStorage
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Test getting user info
        response = requests.get(f"{BASE_URL}/user/me", headers=headers)
        print(f"User info - Status: {response.status_code}")
        if response.status_code == 200:
            user_data = response.json()
            print(f"User role: {user_data.get('role', 'Unknown')}")
            print(f"Username: {user_data.get('username', 'Unknown')}")
            print(f"Email: {user_data.get('email', 'Unknown')}")
        else:
            print(f"Error getting user info: {response.text}")
            
        # Test admin products access
        response = requests.get(f"{BASE_URL}/admin/products", headers=headers)
        print(f"Admin products - Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Admin access granted!")
        else:
            print(f"❌ Admin access denied: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

def get_token_from_browser_instructions():
    """Instructions for getting the token from browser"""
    print("\n" + "="*50)
    print("TO GET YOUR JWT TOKEN FROM BROWSER:")
    print("="*50)
    print("1. Open browser and go to your admin panel")
    print("2. Open Developer Tools (F12)")
    print("3. Go to Application tab (or Storage tab)")
    print("4. Go to Local Storage")
    print("5. Find 'access_token' or 'authToken'")
    print("6. Copy the token value")
    print("7. Replace 'your_jwt_token_here' in this script")
    print("8. Run this script again")
    print("="*50)

def check_user_role_in_db():
    """Check all users and their roles"""
    print("\nChecking user roles in database...")
    try:
        response = requests.get(f"{BASE_URL}/user/all")
        if response.status_code == 200:
            users = response.json()
            print("Current users and roles:")
            for user in users:
                role = user.get('role', 'Unknown')
                role_name = "Admin" if role == 0 else "User" if role == 1 else f"Unknown({role})"
                print(f"  {user.get('username', 'N/A'):20} | Role: {role_name:10} | Email: {user.get('email', 'N/A')}")
        else:
            print(f"Failed to get users: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("MonkeyZ Admin Authentication Test")
    print("=" * 40)
    
    check_user_role_in_db()
    get_token_from_browser_instructions()
    
    print("\nAfter you get your token, uncomment and run test_admin_authentication()")
    # test_admin_authentication()  # Uncomment after getting token
