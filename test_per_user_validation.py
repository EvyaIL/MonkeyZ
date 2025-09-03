#!/usr/bin/env python3
"""
Test script to verify per-user coupon validation is working correctly
"""

import requests
import json

API_URL = "http://localhost:8000"

def test_per_user_coupon_validation():
    """Test per-user coupon validation with test5 coupon"""
    
    print("=== TESTING PER-USER COUPON VALIDATION ===\n")
    
    # Test data
    test_coupon = "test5"
    test_email = "mrbrownaffiliate@gmail.com"  # Email that has exceeded limit
    test_amount = 100.0
    
    print(f"Testing coupon: {test_coupon}")
    print(f"Testing email: {test_email}")
    print(f"Testing amount: ₪{test_amount}")
    print()
    
    # Make validation request
    try:
        payload = {
            "code": test_coupon,
            "amount": test_amount,
            "email": test_email
        }
        
        print("Sending validation request...")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{API_URL}/api/coupons/validate", json=payload)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
        
        result = response.json()
        
        # Check if validation correctly blocks the coupon
        is_valid = result.get('valid', False) and result.get('discount', 0) > 0
        has_error = result.get('error') or result.get('message', '').lower().find('limit') >= 0
        
        print(f"\nAnalysis:")
        print(f"- Valid: {is_valid}")
        print(f"- Has Error: {has_error}")
        print(f"- Discount: ₪{result.get('discount', 0)}")
        print(f"- Message: {result.get('message', 'None')}")
        
        if has_error and not is_valid:
            print("✅ SUCCESS: Coupon correctly blocked for user who exceeded limit")
        elif is_valid and not has_error:
            print("❌ FAILURE: Coupon incorrectly allowed for user who exceeded limit")
        else:
            print("❓ UNCLEAR: Mixed signals in response")
            
    except Exception as e:
        print(f"❌ ERROR: Request failed - {e}")

if __name__ == "__main__":
    test_per_user_coupon_validation()
