#!/usr/bin/env python3
"""
Test coupon validation via API instead of direct database access
"""
import requests
import json

def test_coupon_via_api():
    """Test coupon validation using the backend API"""
    
    # Backend API URL
    base_url = "http://localhost:8002"
    
    # Test cases
    test_cases = [
        {
            "email": "mrbrownaffiliate@gmail.com",
            "coupon": "test11",
            "description": "test11 with mrbrownaffiliate@gmail.com"
        },
        {
            "email": "mrbrownaffiliate@gmail.com", 
            "coupon": "test60",
            "description": "test60 with mrbrownaffiliate@gmail.com"
        }
    ]
    
    print("🚀 COUPON VALIDATION API TEST")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}️⃣ Testing: {test_case['description']}")
        print(f"   📧 Email: {test_case['email']}")
        print(f"   🎫 Coupon: {test_case['coupon']}")
        
        try:
            # Call the validation API
            url = f"{base_url}/api/coupons/validate"
            payload = {
                "code": test_case['coupon'],
                "email": test_case['email'],
                "amount": 100  # Test with $100 cart
            }
            
            print(f"   🌐 Calling: POST {url}")
            print(f"   📤 Payload: {payload}")
            
            response = requests.post(url, json=payload, timeout=10)
            
            print(f"   📥 Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Response: {json.dumps(result, indent=2)}")
                
                # Analyze the result
                if result.get('valid') == True:
                    print(f"   🎉 COUPON VALID - Discount: {result.get('discountAmount', 'N/A')}")
                else:
                    print(f"   ❌ COUPON INVALID - Reason: {result.get('message', 'No reason provided')}")
                    
            else:
                print(f"   ❌ API Error: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   📋 Error details: {json.dumps(error_detail, indent=2)}")
                except:
                    print(f"   📋 Error text: {response.text}")
                    
        except requests.exceptions.ConnectionError:
            print(f"   ❌ CONNECTION ERROR - Is the backend running on {base_url}?")
        except requests.exceptions.Timeout:
            print(f"   ❌ TIMEOUT ERROR - API took too long to respond")
        except Exception as e:
            print(f"   ❌ UNEXPECTED ERROR: {e}")
    
    print(f"\n🏁 Test completed!")

if __name__ == "__main__":
    test_coupon_via_api()
