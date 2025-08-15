import requests
import json

def test_coupon_debug():
    """Test coupon validation with different codes to debug the issue"""
    
    test_codes = ["test4", "test6", "TEST4", "TEST6"]
    
    for code in test_codes:
        print(f"\n=== TESTING COUPON: {code} ===")
        validation_url = "http://localhost:8000/api/coupons/validate"
        validation_data = {
            "code": code,
            "amount": 100,
            "email": "brownmaster555@gmail.com"
        }
        
        try:
            response = requests.post(validation_url, json=validation_data)
            print(f"Status: {response.status_code}")
            result = response.json()
            print(f"Response: {result}")
            
            if response.status_code == 200:
                print(f"✅ SUCCESS: {code} is valid!")
                break
            else:
                print(f"❌ FAILED: {code} not found")
                
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_coupon_debug()
