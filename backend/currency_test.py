#!/usr/bin/env python3
"""
Quick PayPal Currency Test
Test which currencies work with your live PayPal account
"""

import os
import requests
import json

def test_currency_support():
    """Test currency support for your PayPal live account"""
    
    # Your live credentials
    client_id = "AXu-4q2i_746jXHFnUbYUSDxSHZF5og7QtErtmy9eJHkzBpumtDFLpJz6OQollNpRDFlqP2w3rg7DiCF"
    client_secret = "EFSSMeABjIoXXNK6kVMR_P91xeLzj_fMBHG7SNJ7gx9ojRM2GUqUS0Y2tH1cd3lMDschkeOj8L0YEKLb"
    
    # Get access token
    url = "https://api-m.paypal.com/v1/oauth2/token"
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US",
    }
    data = "grant_type=client_credentials"
    
    try:
        response = requests.post(
            url,
            headers=headers,
            data=data,
            auth=(client_id, client_secret),
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get access token: {response.text}")
            return
            
        access_token = response.json()["access_token"]
        print("✅ Got access token")
        
    except Exception as e:
        print(f"❌ Error getting token: {e}")
        return
    
    # Test simple order creation with ILS
    order_url = "https://api-m.paypal.com/v2/checkout/orders"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
        "PayPal-Request-Id": "currency-test-ils-001"
    }
    
    # Simple ILS order
    order_data = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {
                "currency_code": "ILS",
                "value": "50.00"
            },
            "description": "Test ILS order"
        }]
    }
    
    print("\\n🧪 Testing ILS currency support...")
    
    try:
        response = requests.post(
            order_url,
            headers=headers,
            json=order_data,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        response_data = response.json()
        
        if response.status_code == 201:
            print("✅ ILS order created successfully!")
            print(f"Order ID: {response_data.get('id')}")
        else:
            print("❌ ILS order failed")
            print(f"Error: {json.dumps(response_data, indent=2)}")
            
            # Check for specific error
            details = response_data.get('details', [])
            for detail in details:
                if 'CURRENCY_NOT_SUPPORTED' in detail.get('issue', ''):
                    print("\\n🔍 Currency not supported error detected")
                    print("Your PayPal account may not support ILS transactions")
                    print("Recommendation: Use USD instead")
                    
    except Exception as e:
        print(f"❌ Error testing ILS: {e}")

if __name__ == "__main__":
    test_currency_support()
