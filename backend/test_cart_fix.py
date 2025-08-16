import requests
import json

def test_product_api_fix():
    """Test if the Product API now returns proper id fields"""
    
    print("=== TESTING PRODUCT API FIX ===")
    
    try:
        response = requests.get('http://localhost:8000/product/all')
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            products = response.json()
            print(f"Found {len(products)} products")
            
            if products:
                # Show first product structure
                first_product = products[0]
                print(f"\nFirst product ID fields:")
                print(f"  id: {first_product.get('id')} (type: {type(first_product.get('id'))})")
                print(f"  _id: {first_product.get('_id')} (type: {type(first_product.get('_id'))})")
                
                # Test cart validation logic
                valid_product_ids = set()
                for p in products:
                    product_id = p.get('id') or p.get('_id')
                    if product_id:
                        valid_product_ids.add(str(product_id))
                
                print(f"\nValid product IDs for cart validation: {valid_product_ids}")
                
                # Test with sample cart item
                sample_cart_id = str(first_product.get('_id') or first_product.get('id'))
                validation_result = sample_cart_id in valid_product_ids
                print(f"Sample cart validation: {sample_cart_id} -> {validation_result}")
                
                if validation_result:
                    print("✅ Cart validation should now work correctly!")
                else:
                    print("❌ Cart validation still has issues")
        else:
            print(f"❌ API error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_product_api_fix()
