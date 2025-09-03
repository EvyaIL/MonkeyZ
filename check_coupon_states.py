#!/usr/bin/env python3
"""
Check current coupon states to understand usage counts
"""
import requests
import json

def check_coupon_states():
    """Check the current state of test coupons"""
    
    base_url = "http://localhost:8002"
    
    coupons_to_check = ["test11", "test60", "test12"]
    
    print("🔍 COUPON STATE CHECKER")
    print("=" * 50)
    print("Let's see the actual stored data for these coupons")
    print()
    
    for coupon_code in coupons_to_check:
        print(f"🎫 Checking coupon: {coupon_code}")
        
        try:
            # Try to validate with a test email to get coupon data
            url = f"{base_url}/api/coupons/validate"
            payload = {
                "code": coupon_code,
                "email": "statecheck@example.com",
                "amount": 100
            }
            
            response = requests.post(url, json=payload, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                
                if 'coupon' in result:
                    coupon_data = result['coupon']
                    usage_count = coupon_data.get('usageCount', 'unknown')
                    max_uses = coupon_data.get('maxUses', 'unknown')
                    max_per_user = coupon_data.get('maxUsagePerUser', 'unknown')
                    
                    print(f"   📊 Usage Count: {usage_count}")
                    print(f"   🎯 Max Uses: {max_uses}")
                    print(f"   👤 Max Per User: {max_per_user}")
                    print(f"   ✅ Status: {'AVAILABLE' if usage_count < max_uses else 'EXHAUSTED'}")
                    
                    if 'userUsages' in coupon_data:
                        user_usages = coupon_data['userUsages']
                        print(f"   👥 User Usages: {len(user_usages)} users")
                        for email, count in user_usages.items():
                            print(f"      - {email}: {count} uses")
                else:
                    print(f"   ❌ No coupon data in response")
                    print(f"   📋 Response: {json.dumps(result, indent=2)}")
            else:
                print(f"   ❌ API Error: {response.status_code}")
                print(f"   📋 Response: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print()  # Empty line between coupons

if __name__ == "__main__":
    check_coupon_states()
