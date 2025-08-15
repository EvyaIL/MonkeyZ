#!/usr/bin/env python3
"""
Simple test to check coupon validation endpoint
"""
import requests
import json
import time

def test_coupon_endpoint():
    """Test the coupon validation endpoint"""
    print("Testing coupon validation endpoint...")
    
    # Wait a moment for server to be ready
    time.sleep(2)
    
    test_data = {
        'code': 'test4',  # This coupon was created according to the logs
        'amount': 100.0,
        'email': 'test@example.com'
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/api/coupons/validate',
            json=test_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ SUCCESS!")
        else:
            print(f"❌ FAILED with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    test_coupon_endpoint()
