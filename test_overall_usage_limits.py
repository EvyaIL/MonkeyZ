#!/usr/bin/env python3
"""
Test overall coupon usage limits (maxUses) to ensure they work correctly
"""
import requests
import json

def test_overall_usage_limits():
    """Test coupons with overall usage limits"""
    
    base_url = "http://localhost:8002"
    
    test_scenarios = [
        {
            "name": "Test11 Overall Usage Limit",
            "coupon": "test11",
            "email": "newuser@example.com",  # Different email to avoid per-user blocking
            "description": "test11 has usageCount=1, maxUses=2, should work for new user"
        },
        {
            "name": "Test60 Overall Usage Limit", 
            "coupon": "test60",
            "email": "anothernewuser@example.com",  # Different email
            "description": "test60 has usageCount=1, maxUses=2, should work for new user"
        }
    ]
    
    print("🚀 OVERALL USAGE LIMITS TEST")
    print("=" * 50)
    print("This test checks if coupons respect their maxUses limit")
    print("Both coupons have usageCount=1 and maxUses=2, so they should still work for new users")
    print()
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"{i}️⃣ {scenario['name']}")
        print(f"   📧 Email: {scenario['email']}")
        print(f"   🎫 Coupon: {scenario['coupon']}")
        print(f"   📝 Description: {scenario['description']}")
        
        try:
            url = f"{base_url}/api/coupons/validate"
            payload = {
                "code": scenario['coupon'],
                "email": scenario['email'],
                "amount": 100
            }
            
            response = requests.post(url, json=payload, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('valid') == True:
                    discount = result.get('discount', 0)
                    print(f"   ✅ RESULT: VALID - Discount: ${discount}")
                    
                    # Show usage info if available
                    if 'coupon' in result:
                        usage_count = result['coupon'].get('usageCount', 'unknown')
                        max_uses = result['coupon'].get('maxUses', 'unknown')
                        print(f"   📊 Usage: {usage_count}/{max_uses}")
                else:
                    reason = result.get('message', 'No reason provided')
                    print(f"   ❌ RESULT: INVALID - Reason: {reason}")
                    
                print(f"   📋 Full Response: {json.dumps(result, indent=2)}")
            else:
                print(f"   ❌ API Error: {response.status_code}")
                print(f"   📋 Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print()  # Empty line between tests
    
    print("🏁 Test completed!")
    print()
    print("Expected Results:")
    print("✅ Both coupons should be VALID for new users (usageCount 1/2 < maxUses 2)")
    print("❌ If INVALID due to overall limits, the fix is working but usage is actually at limit")

if __name__ == "__main__":
    test_overall_usage_limits()
