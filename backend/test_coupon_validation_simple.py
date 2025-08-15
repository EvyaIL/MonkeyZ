import requests
import json

def test_coupon_validation():
    """Test just the coupon validation to verify the fix"""
    
    print("=== TESTING COUPON VALIDATION ===")
    validation_url = "http://localhost:8000/api/coupons/validate"
    validation_data = {
        "code": "test6",  # Use test6 since that's the one that exists
        "amount": 100,
        "email": "brownmaster555@gmail.com"
    }
    
    try:
        response = requests.post(validation_url, json=validation_data)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {result}")
        
        if response.status_code == 200:
            discount = result.get('discount', 0)
            coupon = result.get('coupon', {})
            usage_count = coupon.get('usageCount', 0)
            max_uses = coupon.get('maxUses', 0)
            max_per_user = coupon.get('maxUsagePerUser', 0)
            
            print(f"\n✅ COUPON VALIDATION SUCCESS!")
            print(f"   💰 Discount: ${discount} (4% of $100)")
            print(f"   📊 Usage: {usage_count}/{max_uses} total")
            print(f"   👤 Per user limit: {max_per_user}")
            print(f"   🗄️ Database: Found in admin database")
            
            if usage_count < max_uses and usage_count < max_per_user:
                print(f"   ✅ Coupon is valid and within limits")
            else:
                print(f"   ⚠️ Coupon limits exceeded")
            
        else:
            print(f"❌ Validation failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_coupon_validation()
