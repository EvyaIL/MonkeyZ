import requests
import json

def test_coupon_flow():
    """Test the complete coupon flow: validation -> PayPal -> capture"""
    
    # 1. Test coupon validation first
    print("=== TESTING COUPON VALIDATION ===")
    validation_url = "http://localhost:8000/api/coupons/validate"
    validation_data = {
        "code": "test4",
        "amount": 100,
        "email": "evyatarhypixel1477@gmail.com"
    }
    
    try:
        response = requests.post(validation_url, json=validation_data)
        print(f"Validation Status: {response.status_code}")
        print(f"Validation Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Coupon validation working!")
        else:
            print("❌ Coupon validation failed!")
            return
            
    except Exception as e:
        print(f"❌ Validation Error: {e}")
        return
    
    # 2. Test PayPal order creation with coupon
    print("\n=== TESTING PAYPAL ORDER CREATION WITH COUPON ===")
    paypal_url = "http://localhost:8000/api/orders/paypal/orders"
    paypal_data = {
        "cart": [{"productId": "63f8b2a3c4e5f6a7b8c9d0e1", "quantity": 1}],  # Replace with real product ID
        "couponCode": "test4",
        "customerEmail": "evyatarhypixel1477@gmail.com",
        "customerName": "Test User"
    }
    
    try:
        response = requests.post(paypal_url, json=paypal_data)
        print(f"PayPal Status: {response.status_code}")
        print(f"PayPal Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ PayPal order creation working!")
        else:
            print("❌ PayPal order creation failed!")
            
    except Exception as e:
        print(f"❌ PayPal Error: {e}")
    
    print("\n=== TEST COMPLETE ===")

if __name__ == "__main__":
    test_coupon_flow()
