#!/usr/bin/env python3
"""
Test PayPal SDK URL without buyer-country parameter
"""
import requests
import os
from dotenv import load_dotenv

def test_paypal_sdk_production():
    """Test PayPal SDK URL for production (without buyer-country)"""
    load_dotenv()
    
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    
    # Production URL without buyer-country parameter
    sdk_url = f"https://www.paypal.com/sdk/js?client-id={client_id}&currency=ILS&intent=capture&components=buttons&commit=true&locale=he_IL&disable-funding=venmo,sepa,bancontact,giropay,ideal,eps,sofort,mybank,p24&debug=false"
    
    print("🧪 Testing PayPal SDK URL for Production")
    print("=" * 60)
    print(f"Client ID: {client_id}")
    print(f"URL: {sdk_url}")
    print()
    
    try:
        response = requests.get(sdk_url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: PayPal SDK script loads successfully!")
            print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
            print(f"Content-Length: {len(response.content)} bytes")
            
            # Check if the response contains valid JavaScript
            if 'application/javascript' in response.headers.get('content-type', ''):
                print("✅ Response contains valid JavaScript")
            
            return True
        else:
            print(f"❌ FAILED: PayPal SDK script failed to load")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_paypal_sdk_production()
    print("\n" + "=" * 60)
    if success:
        print("🎉 PayPal SDK is now working correctly!")
        print("💡 You can now refresh your frontend and the PayPal buttons should load properly.")
    else:
        print("❌ PayPal SDK still has issues.")
        print("💡 Please check the PayPal client ID and credentials.")
