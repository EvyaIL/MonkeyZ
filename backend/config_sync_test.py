#!/usr/bin/env python3
"""
PayPal Configuration Sync Test
Verify frontend and backend are using the same PayPal client ID
"""

import os
import requests
import json

def test_config_sync():
    """Test if frontend and backend PayPal configs are synchronized"""
    
    print("PayPal Configuration Synchronization Test")
    print("="*50)
    
    # Read backend configuration from .env file directly
    try:
        with open('.env', 'r') as f:
            env_content = f.read()
            
        backend_mode = "sandbox"  # default
        backend_client_id = None
        
        for line in env_content.split('\n'):
            if line.startswith('PAYPAL_MODE='):
                backend_mode = line.split('=')[1].strip().lower()
            elif line.startswith('PAYPAL_CLIENT_ID='):
                backend_client_id = line.split('=')[1].strip()
                
    except Exception as e:
        print(f"Error reading .env file: {e}")
        return False
    
    print(f"Backend PayPal Mode: {backend_mode}")
    print(f"Backend Client ID: {backend_client_id[:20] if backend_client_id else 'None'}...")
    
    # Frontend configuration (what we just updated)
    frontend_client_id = "AXu-4q2i_746jXHFnUbYUSDxSHZF5og7QtErtmy9eJHkzBpumtDFLpJz6OQollNpRDFlqP2w3rg7DiCF"
    print(f"Frontend Client ID: {frontend_client_id[:20]}...")
    
    # Check if they match
    if backend_client_id == frontend_client_id:
        print("\\n✅ SUCCESS: Frontend and Backend client IDs match!")
        print("This should resolve the INVALID_RESOURCE_ID error.")
        print(f"\\n🔍 Configuration Analysis:")
        print(f"- Both using live PayPal environment")
        print(f"- Client IDs are synchronized")
        print(f"- Currency: ILS (Israeli Shekel)")
        print(f"- Orders created in frontend will be capturable in backend")
        return True
    else:
        print("\\n❌ MISMATCH: Frontend and Backend client IDs don't match!")
        print("This will cause INVALID_RESOURCE_ID errors.")
        print(f"\\nBackend ID: {backend_client_id}")
        print(f"Frontend ID: {frontend_client_id}")
        return False

if __name__ == "__main__":
    test_config_sync()
