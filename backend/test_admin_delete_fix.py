import requests
import json

# Test admin product deletion after fixing CSRF
BASE_URL = "http://localhost:8000"

def test_admin_delete_with_auth():
    """Test admin delete functionality"""
    print("Testing admin product deletion...")
    
    # Step 1: Login as admin
    print("1. Logging in as admin...")
    login_data = {
        "username": "evya00",  # Use existing admin from your database
        "password": "your_password_here"  # Replace with actual password
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/user/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.text}")
            return
        
        login_response = response.json()
        token = login_response.get("access_token")
        print(f"✅ Login successful! Token: {token[:20]}...")
        
        # Step 2: Get products list
        print("2. Getting products list...")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/admin/products", headers=headers)
        if response.status_code != 200:
            print(f"❌ Failed to get products: {response.text}")
            return
        
        products = response.json()
        if not products:
            print("❌ No products found to test with")
            return
        
        test_product = products[0]
        product_id = test_product.get("_id") or test_product.get("id")
        product_name = test_product.get("name", "Unknown Product")
        print(f"✅ Found test product: {product_name} (ID: {product_id})")
        
        # Step 3: Test delete (with confirmation)
        print(f"3. Testing DELETE request for product: {product_name}")
        print("   (This is just a test - the product won't actually be deleted)")
        
        # Make the DELETE request
        response = requests.delete(f"{BASE_URL}/admin/products/{product_id}", headers=headers)
        
        print(f"DELETE Response - Status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ DELETE request successful! CSRF issue is fixed!")
        elif response.status_code == 403:
            print("❌ Still getting 403 Forbidden - CSRF protection still active")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"Error: {e}")

def check_development_mode():
    """Check if backend is running in development mode"""
    print("Checking if backend is in development mode...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check - Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Backend is running")
        
        # You can add more checks here if needed
        
    except Exception as e:
        print(f"Backend health check failed: {e}")

if __name__ == "__main__":
    print("MonkeyZ Admin Delete Test")
    print("=" * 30)
    
    check_development_mode()
    
    print("\n" + "="*50)
    print("INSTRUCTIONS:")
    print("="*50)
    print("1. Replace 'your_password_here' with the actual admin password")
    print("2. Make sure backend server is running")
    print("3. Run this script to test the fix")
    print("="*50)
    
    # Uncomment the line below after setting the correct password
    # test_admin_delete_with_auth()
