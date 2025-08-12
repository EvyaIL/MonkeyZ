#!/usr/bin/env python3
"""
PayPal Client ID Validation Test
Tests if the PayPal client ID and credentials are valid for live environment
"""
import os
import requests
import base64
from dotenv import load_dotenv

def test_paypal_client_id_validation():
    """Test PayPal client ID validation through their API"""
    load_dotenv()
    
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    client_secret = os.getenv('PAYPAL_CLIENT_SECRET')
    mode = os.getenv('PAYPAL_MODE', 'sandbox')
    
    print(f"🔍 Testing PayPal Client ID: {client_id}")
    print(f"🌍 PayPal Mode: {mode}")
    
    # Determine the base URL based on mode
    if mode == 'live':
        base_url = "https://api-m.paypal.com"
    else:
        base_url = "https://api-m.sandbox.paypal.com"
    
    print(f"🔗 Using PayPal API URL: {base_url}")
    
    # Test 1: Get access token
    print("\n📋 Test 1: Getting Access Token")
    try:
        auth_url = f"{base_url}/v1/oauth2/token"
        auth_headers = {
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': f'Basic {base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()}'
        }
        auth_data = 'grant_type=client_credentials'
        
        response = requests.post(auth_url, headers=auth_headers, data=auth_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access_token')
            print("✅ Access token obtained successfully")
            print(f"Token Type: {token_data.get('token_type')}")
            print(f"Expires in: {token_data.get('expires_in')} seconds")
            return access_token
        else:
            print(f"❌ Failed to get access token")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error getting access token: {e}")
        return None

def test_paypal_sdk_url():
    """Test the PayPal SDK URL directly"""
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    
    # This is the exact URL being called by your frontend
    sdk_url = f"https://www.paypal.com/sdk/js?client-id={client_id}&currency=ILS&intent=capture&components=buttons&commit=true&locale=he_IL&disable-funding=venmo,sepa,bancontact,giropay,ideal,eps,sofort,mybank,p24&buyer-country=IL&debug=false"
    
    print(f"\n📋 Test 2: Testing PayPal SDK URL")
    print(f"🔗 URL: {sdk_url}")
    
    try:
        response = requests.get(sdk_url)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ PayPal SDK script loads successfully")
            print(f"Content-Type: {response.headers.get('content-type', 'N/A')}")
            print(f"Content-Length: {len(response.content)} bytes")
        else:
            print(f"❌ PayPal SDK script failed to load")
            print(f"Response headers: {dict(response.headers)}")
            if response.text:
                print(f"Response body: {response.text[:500]}...")
                
    except Exception as e:
        print(f"❌ Error testing SDK URL: {e}")

def test_client_id_format():
    """Validate client ID format"""
    client_id = os.getenv('PAYPAL_CLIENT_ID')
    
    print(f"\n📋 Test 3: Client ID Format Validation")
    print(f"Client ID: {client_id}")
    print(f"Length: {len(client_id) if client_id else 0}")
    
    if not client_id:
        print("❌ Client ID is empty")
        return False
    
    # PayPal client IDs are typically 80 characters long
    if len(client_id) != 80:
        print(f"⚠️  Client ID length is {len(client_id)}, expected 80")
    
    # Check if it contains only valid characters
    valid_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_')
    if all(c in valid_chars for c in client_id):
        print("✅ Client ID format appears valid")
        return True
    else:
        print("❌ Client ID contains invalid characters")
        return False

if __name__ == "__main__":
    print("🧪 PayPal Client ID Validation Test")
    print("=" * 50)
    
    load_dotenv()
    
    # Test client ID format
    test_client_id_format()
    
    # Test getting access token
    access_token = test_paypal_client_id_validation()
    
    # Test SDK URL
    test_paypal_sdk_url()
    
    print("\n" + "=" * 50)
    if access_token:
        print("🎉 Overall Result: PayPal credentials appear to be working")
        print("💡 The 400 error might be due to other factors like:")
        print("   - CORS issues")
        print("   - PayPal account settings")
        print("   - Geographic restrictions")
        print("   - Currency/locale configuration")
    else:
        print("❌ Overall Result: PayPal credentials have issues")
        print("💡 Recommended actions:")
        print("   - Verify client ID and secret in PayPal dashboard")
        print("   - Check if live credentials are properly activated")
        print("   - Ensure account is approved for live transactions")
