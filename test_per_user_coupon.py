import requests
import json

def test_per_user_coupon_limit():
    """Test per-user coupon validation"""
    
    # Test data for a coupon with per-user limit
    test_data = {
        'code': 'test3',  # Assuming this has maxUsagePerUser set
        'amount': 100.0,
        'email': 'test@example.com'
    }
    
    print("=== Testing Per-User Coupon Validation ===")
    print(f"Testing coupon: {test_data['code']}")
    print(f"User email: {test_data['email']}")
    print(f"Amount: {test_data['amount']}")
    
    try:
        # Test the validation multiple times to see if per-user limit works
        for i in range(3):
            print(f"\n--- Attempt {i+1} ---")
            
            response = requests.post(
                'http://127.0.0.1:8000/api/coupons/validate',
                json=test_data,
                timeout=10
            )
            
            print(f"Status Code: {response.status_code}")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
            
            # Check frontend interpretation
            is_valid = result.get('valid') != False and not result.get('error') and result.get('discount', 0) > 0
            has_error = result.get('valid') == False or result.get('error')
            
            print(f"Frontend would show: valid={is_valid}, error={has_error}")
            
            if result.get('discount', 0) > 0:
                print(f"✅ Would show discount: ₪{result['discount']}")
            else:
                print(f"❌ Would show error: {result.get('message', 'No discount')}")
            
    except Exception as e:
        print(f"Error: {e}")

    # Test with different user to verify it's per-user not global
    print("\n=== Testing with Different User ===")
    test_data2 = {
        'code': 'test3',
        'amount': 100.0,
        'email': 'different@example.com'
    }
    
    try:
        response = requests.post(
            'http://127.0.0.1:8000/api/coupons/validate',
            json=test_data2,
            timeout=10
        )
        
        result = response.json()
        print(f"Different user response: {json.dumps(result, indent=2)}")
        
        if result.get('discount', 0) > 0:
            print("✅ Different user can still use coupon")
        else:
            print("❌ Different user also blocked")
            
    except Exception as e:
        print(f"Error testing different user: {e}")

if __name__ == "__main__":
    test_per_user_coupon_limit()
