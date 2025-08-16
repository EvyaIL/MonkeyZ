import requests
import json

def check_admin_coupons():
    """Check what coupons are available in the admin database"""
    
    print("=== CHECKING ADMIN COUPONS ===")
    
    # Test the admin endpoint for coupons (if available)
    try:
        # Try to get coupons from admin API
        admin_response = requests.get('http://localhost:8000/admin/coupons')
        if admin_response.status_code == 200:
            coupons = admin_response.json()
            print(f"Found {len(coupons)} coupons in admin database:")
            for coupon in coupons:
                print(f"  - {coupon.get('code', 'N/A')}: ${coupon.get('discount', 'N/A')} ({coupon.get('type', 'N/A')})")
                print(f"    Active: {coupon.get('is_active', 'N/A')}, Uses: {coupon.get('used_count', 'N/A')}/{coupon.get('max_uses', 'N/A')}")
        else:
            print(f"Admin coupons endpoint returned: {admin_response.status_code}")
            print(f"Response: {admin_response.text}")
    except Exception as e:
        print(f"Error accessing admin coupons: {e}")
    
    print("\n=== TESTING KNOWN WORKING COUPON ===")
    
    # Test the coupon that worked (test11)
    validation_response = requests.post(
        'http://localhost:8000/api/coupons/validate',
        json={'code': 'test11', 'amount': 100}
    )
    
    print(f"test11 validation - Status: {validation_response.status_code}")
    if validation_response.status_code == 200:
        data = validation_response.json()
        print(f"Response: {json.dumps(data, indent=2)}")

if __name__ == "__main__":
    check_admin_coupons()
