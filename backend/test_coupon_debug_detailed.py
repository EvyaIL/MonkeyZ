import requests
import json

def test_coupon_validation():
    """Test coupon validation with detailed database information"""
    
    # Test with a coupon that exists
    print("=== TESTING COUPON VALIDATION (DETAILED) ===")
    
    # First check what coupons exist in admin database
    debug_response = requests.get('http://localhost:8000/api/debug/environment')
    if debug_response.status_code == 200:
        debug_data = debug_response.json()
        print("\nDatabase Status:")
        for db_name, db_info in debug_data['databases'].items():
            print(f"  {db_name}: {db_info['coupons_count']} coupons, {db_info['orders_count']} orders")
        
        print("\nCoupon Usage Samples:")
        for db_name, sample_info in debug_data['coupon_usage_sample'].items():
            if sample_info:
                print(f"  {db_name}: coupon '{sample_info['sample_coupon']}' used {sample_info['usage_count']} times")
    
    # Test validation of specific coupons
    test_coupons = ['test3', 'test11', 'DISCOUNT10', 'SAVE20']
    
    for coupon_code in test_coupons:
        print(f"\n--- Testing coupon: {coupon_code} ---")
        
        validation_response = requests.post(
            'http://localhost:8000/api/coupons/validate',
            json={'code': coupon_code, 'amount': 100}  # Use correct field names
        )
        
        print(f"Status: {validation_response.status_code}")
        if validation_response.status_code == 200:
            data = validation_response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"Error: {validation_response.text}")

if __name__ == "__main__":
    test_coupon_validation()
