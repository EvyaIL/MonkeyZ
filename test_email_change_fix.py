#!/usr/bin/env python3
"""
Test the email change coupon validation fix
"""
import requests
import json
import time

def test_email_change_validation():
    """Test coupon validation with different email scenarios"""
    
    base_url = "http://localhost:8002"
    
    test_scenarios = [
        {
            "name": "Incomplete Email Test",
            "email": "mrbrownaffi",  # Incomplete email
            "coupon": "test11",
            "expected": "Should fail due to invalid email format"
        },
        {
            "name": "Complete Valid Email Test", 
            "email": "test@example.com",  # Different email (should work)
            "coupon": "test11",
            "expected": "Should work for new user"
        },
        {
            "name": "Complete Blocked Email Test",
            "email": "mrbrownaffiliate@gmail.com",  # Email that exceeded limit
            "coupon": "test11", 
            "expected": "Should be blocked due to per-user limit"
        }
    ]
    
    print("🚀 EMAIL CHANGE VALIDATION TEST")
    print("=" * 50)
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n{i}️⃣ {scenario['name']}")
        print(f"   📧 Email: {scenario['email']}")
        print(f"   🎫 Coupon: {scenario['coupon']}")
        print(f"   🎯 Expected: {scenario['expected']}")
        
        try:
            url = f"{base_url}/api/coupons/validate"
            payload = {
                "code": scenario['coupon'],
                "email": scenario['email'],
                "amount": 100
            }
            
            response = requests.post(url, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('valid') == True:
                    print(f"   ✅ RESULT: VALID - Discount: {result.get('discount', 0)}")
                else:
                    print(f"   ❌ RESULT: INVALID - Reason: {result.get('message', 'No message')}")
                    
                print(f"   📋 Full Response: {json.dumps(result, indent=2)}")
            else:
                print(f"   ❌ API Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        time.sleep(0.5)  # Small delay between tests
    
    print(f"\n🏁 Test completed!")

if __name__ == "__main__":
    test_email_change_validation()
