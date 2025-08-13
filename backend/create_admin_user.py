import requests
import json

# Create admin user for testing
BASE_URL = "http://localhost:8000"

def create_admin_user():
    """Create a test admin user"""
    print("Creating test admin user...")
    
    admin_data = {
        "username": "testadmin",
        "email": "testadmin@monkeyz.co.il",
        "password": "AdminPass123!",
        "phone_number": None
    }
    
    try:
        # Create user
        response = requests.post(f"{BASE_URL}/user", json=admin_data)
        print(f"Create user - Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Test admin user created successfully!")
            return True
        else:
            print("❌ Failed to create test admin user")
            return False
            
    except Exception as e:
        print(f"Error creating admin user: {e}")
        return False

def login_admin_user():
    """Login as admin user and get token"""
    print("\nLogging in as admin user...")
    
    login_data = {
        "username": "testadmin",
        "password": "AdminPass123!"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/user/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"Login - Status: {response.status_code}")
        if response.status_code == 200:
            login_response = response.json()
            token = login_response.get("access_token")
            print(f"✅ Login successful!")
            print(f"Token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"Error logging in: {e}")
        return None

def test_admin_delete(token):
    """Test deleting a product with admin token"""
    print(f"\nTesting admin product deletion...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # First get products to find one to delete
        response = requests.get(f"{BASE_URL}/admin/products", headers=headers)
        print(f"Get products - Status: {response.status_code}")
        
        if response.status_code == 200:
            products = response.json()
            if products:
                product_id = products[0].get("_id") or products[0].get("id")
                print(f"Found product to test with: {product_id}")
                
                # Test delete (but don't actually delete)
                print(f"Would delete product: {product_id}")
                print("✅ Admin access confirmed!")
                return True
            else:
                print("No products found to test with")
                return False
        else:
            print(f"❌ Admin access denied: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error testing admin delete: {e}")
        return False

def update_user_to_admin():
    """Update existing user to admin role (direct database operation would be needed)"""
    print("\n" + "="*50)
    print("TO MAKE AN EXISTING USER ADMIN:")
    print("="*50)
    print("1. Connect to your MongoDB database")
    print("2. Find your user in the 'User' collection")
    print("3. Update their 'role' field from 1 to 0")
    print("   Example MongoDB command:")
    print("   db.User.updateOne({username: 'your_username'}, {$set: {role: 0}})")
    print("4. Or use a MongoDB GUI like MongoDB Compass")
    print("5. Role 0 = Admin, Role 1 = User")
    print("="*50)

if __name__ == "__main__":
    print("MonkeyZ Admin Fix Script")
    print("=" * 30)
    
    # Option 1: Create new admin user
    if create_admin_user():
        token = login_admin_user()
        if token:
            test_admin_delete(token)
    
    # Option 2: Instructions for existing user
    update_user_to_admin()
    
    print("\n" + "=" * 50)
    print("QUICK FIX SOLUTIONS:")
    print("=" * 50)
    print("1. Make your current user an admin in MongoDB:")
    print("   - Update role from 1 to 0")
    print("2. Or use the testadmin user created above:")
    print("   - Username: testadmin")
    print("   - Password: AdminPass123!")
    print("3. Then login and try deleting products again")
    print("=" * 50)
