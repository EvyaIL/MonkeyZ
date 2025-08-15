#!/usr/bin/env python3
"""
Test coupon validation with proper database connection
"""
import requests
import json

def test_coupon_validation():
    """Test coupon validation via API"""
    print("=" * 80)
    print("TESTING COUPON VALIDATION VIA API")
    print("=" * 80)
    
    # Test cases based on the logs
    test_cases = [
        {
            'code': 'test3',
            'amount': 100.0,
            'email': 'mrbrownaffiliate@gmail.com',
            'description': 'User who has used test3 coupon 3 times (should fail if limit is set)'
        },
        {
            'code': 'family50',
            'amount': 100.0,
            'email': 'evyatarhypixel1477@gmail.com',
            'description': 'User who has used family50 coupon'
        },
        {
            'code': 'test3',
            'amount': 100.0,
            'email': 'newuser@example.com',
            'description': 'New user trying test3 coupon (should work if under limits)'
        },
        {
            'code': 'INVALID_CODE',
            'amount': 100.0,
            'email': 'test@example.com',
            'description': 'Invalid coupon code (should fail)'
        }
    ]
    
    base_url = "http://localhost:8000"
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: {test_case['description']}")
        print(f"Code: {test_case['code']}, Amount: {test_case['amount']}, Email: {test_case['email']}")
        print("-" * 40)
        
        try:
            # Test validation via API
            response = requests.post(
                f"{base_url}/api/coupons/validate",
                json={
                    'code': test_case['code'],
                    'amount': test_case['amount'],
                    'email': test_case['email']
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ VALIDATION SUCCESSFUL")
                print(f"   Discount: {data.get('discount', 0)}")
                print(f"   Message: {data.get('message', 'N/A')}")
                if 'coupon' in data and data['coupon']:
                    coupon = data['coupon']
                    print(f"   Max Uses: {coupon.get('maxUses', 'Unlimited')}")
                    print(f"   Max Usage Per User: {coupon.get('maxUsagePerUser', 'Unlimited')}")
                    print(f"   Current Usage Count: {coupon.get('usageCount', 0)}")
                    print(f"   User Usages: {coupon.get('userUsages', {})}")
            else:
                data = response.json()
                print(f"❌ VALIDATION FAILED (Status: {response.status_code})")
                print(f"   Message: {data.get('message', 'Unknown error')}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ REQUEST FAILED: {e}")
        except Exception as e:
            print(f"❌ ERROR: {e}")
        
        print("-" * 40)
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_coupon_validation()
