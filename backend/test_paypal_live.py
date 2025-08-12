#!/usr/bin/env python3
"""
Test PayPal Live Configuration
Check if PayPal live credentials work correctly with different currencies
"""

import os
import requests
import json
from datetime import datetime

def get_paypal_access_token():
    """Get PayPal access token for live environment"""
    
    # Use live credentials from .env
    client_id = "AXu-4q2i_746jXHFnUbYUSDxSHZF5og7QtErtmy9eJHkzBpumtDFLpJz6OQollNpRDFlqP2w3rg7DiCF"
    client_secret = "EFSSMeABjIoXXNK6kVMR_P91xeLzj_fMBHG7SNJ7gx9ojRM2GUqUS0Y2tH1cd3lMDschkeOj8L0YEKLb"
    
    print(f"Testing PayPal Live Mode")
    print(f"Client ID: {client_id[:20]}...")
    
    # PayPal Live API endpoint
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
        
        print(f"Token Request Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Successfully obtained access token")
            print(f"Token Type: {token_data.get('token_type')}")
            print(f"Expires In: {token_data.get('expires_in')} seconds")
            return token_data.get("access_token")
        else:
            print(f"❌ Failed to get access token")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting access token: {str(e)}")
        return None

def test_paypal_order_creation(access_token, currency="USD", amount="10.00"):
    """Test creating a PayPal order with specified currency"""
    
    url = "https://api-m.paypal.com/v2/checkout/orders"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
        "PayPal-Request-Id": f"test-order-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    
    order_data = {
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {
                "currency_code": currency,
                "value": amount
            },
            "description": f"Test order - {currency} {amount}"
        }],
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                    "brand_name": "MonkeyZ Test",
                    "locale": "en-US",
                    "landing_page": "LOGIN",
                    "user_action": "PAY_NOW",
                    "return_url": "https://monkeyz.co.il/success",
                    "cancel_url": "https://monkeyz.co.il/cancel"
                }
            }
        }
    }
    
    try:
        print(f"\n🧪 Testing order creation with {currency} {amount}")
        
        response = requests.post(
            url,
            headers=headers,
            json=order_data,
            timeout=30
        )
        
        print(f"Order Creation Status: {response.status_code}")
        
        if response.status_code == 201:
            order = response.json()
            print(f"✅ Order created successfully")
            print(f"Order ID: {order.get('id')}")
            print(f"Status: {order.get('status')}")
            
            # Check for approval link
            links = order.get('links', [])
            approval_link = next((link['href'] for link in links if link['rel'] == 'approve'), None)
            if approval_link:
                print(f"Approval URL: {approval_link}")
            
            return order
        else:
            print(f"❌ Order creation failed")
            error_data = response.json() if response.content else {}
            print(f"Error Response: {json.dumps(error_data, indent=2)}")
            
            # Specific error analysis
            if "INVALID_RESOURCE_ID" in str(error_data):
                print("\n🔍 INVALID_RESOURCE_ID Error Detected:")
                print("This usually means:")
                print("1. Wrong PayPal environment (sandbox vs live)")
                print("2. Invalid client credentials")
                print("3. Currency not supported in your region")
                print("4. Account restrictions")
                
            return None
            
    except Exception as e:
        print(f"❌ Error creating order: {str(e)}")
        return None

def test_multiple_currencies(access_token):
    """Test order creation with different currencies"""
    
    currencies_to_test = [
        ("USD", "10.00"),  # US Dollar - most supported
        ("EUR", "10.00"),  # Euro - widely supported  
        ("ILS", "35.00"),  # Israeli Shekel - your target currency
        ("GBP", "8.00"),   # British Pound
    ]
    
    results = {}
    
    for currency, amount in currencies_to_test:
        print(f"\n{'='*50}")
        result = test_paypal_order_creation(access_token, currency, amount)
        results[currency] = {
            "success": result is not None,
            "order_id": result.get('id') if result else None
        }
        
        # Add delay between requests
        import time
        time.sleep(2)
    
    return results

def main():
    """Main test function"""
    
    print("PayPal Live Configuration Test")
    print("="*50)
    
    # Step 1: Get access token
    access_token = get_paypal_access_token()
    
    if not access_token:
        print("\n❌ Cannot proceed without access token")
        print("\nPossible issues:")
        print("1. Invalid PayPal live credentials")
        print("2. Network connectivity problems")
        print("3. PayPal API service issues")
        return
    
    # Step 2: Test different currencies
    print(f"\n{'='*50}")
    print("Testing Order Creation with Different Currencies")
    
    results = test_multiple_currencies(access_token)
    
    # Step 3: Summary
    print(f"\n{'='*50}")
    print("SUMMARY")
    print("="*50)
    
    for currency, result in results.items():
        status = "✅ SUCCESS" if result["success"] else "❌ FAILED"
        print(f"{currency}: {status}")
        if result["order_id"]:
            print(f"  Order ID: {result['order_id']}")
    
    # Recommendations
    print(f"\n{'='*50}")
    print("RECOMMENDATIONS")
    print("="*50)
    
    if results.get("USD", {}).get("success"):
        print("✅ USD works - PayPal live credentials are valid")
    else:
        print("❌ USD failed - Check PayPal live credentials")
        
    if results.get("ILS", {}).get("success"):
        print("✅ ILS works - You can accept Israeli Shekels")
    else:
        print("❌ ILS failed - Consider using USD for Israeli customers")
        print("   Many Israeli PayPal users have USD in their accounts")
        
    print(f"\nTimestamp: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
