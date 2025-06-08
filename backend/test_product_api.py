# Test script for checking product API endpoints
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API base URL - adjust this if needed
API_URL = os.getenv("API_URL", "http://localhost:8000")

def test_endpoint(endpoint, params=None):
    """Test an API endpoint and return the results"""
    url = f"{API_URL}{endpoint}"
    print(f"\nTesting endpoint: {url}")
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        data = response.json()
        print(f"Status: {response.status_code}")
        print(f"Response time: {response.elapsed.total_seconds():.2f} seconds")
        
        if isinstance(data, list):
            print(f"Received {len(data)} items")
            if len(data) > 0:
                print("First item:")
                print(json.dumps(data[0], indent=2))
                
                # Check for special flags
                special_flags = {
                    'is_new/isNew': data[0].get('is_new', False) or data[0].get('isNew', False),
                    'best_seller/isBestSeller': data[0].get('best_seller', False) or data[0].get('isBestSeller', False),
                    'display_on_homepage/displayOnHomepage': data[0].get('display_on_homepage', False) or data[0].get('displayOnHomepage', False),
                    'discountPercentage': data[0].get('discountPercentage', 0)
                }
                print("\nSpecial flags in first item:")
                for flag, value in special_flags.items():
                    print(f"- {flag}: {value}")
        else:
            print("Response:")
            print(json.dumps(data, indent=2))
        
        return data
    
    except requests.RequestException as e:
        print(f"Error: {str(e)}")
        return None

def main():
    """Test all product-related endpoints"""
    print("=== Testing MonkeyZ Product API Endpoints ===")
    
    # Test all products endpoint
    all_products = test_endpoint("/product/all")
    
    # Test homepage products endpoint
    homepage_products = test_endpoint("/product/homepage")
    
    # Test best sellers endpoint
    best_sellers = test_endpoint("/product/best-sellers")
    
    # Test recent products endpoint
    recent_products = test_endpoint("/product/recent")
    
    # Summary
    print("\n=== API Test Summary ===")
    print(f"All Products: {len(all_products) if all_products else 'Error'}")
    print(f"Homepage Products: {len(homepage_products) if homepage_products else 'Error'}")
    print(f"Best Sellers: {len(best_sellers) if best_sellers else 'Error'}")
    print(f"Recent Products: {len(recent_products) if recent_products else 'Error'}")
    
    # Check for problems
    print("\nDiagnostic Information:")
    
    if not all_products or len(all_products) == 0:
        print("❌ No products found in the database. Check MongoDB connection and data.")
    else:
        print(f"✅ Found {len(all_products)} products in the database.")
        
    if not homepage_products or len(homepage_products) == 0:
        print("❌ No homepage products found. Check if products have display_on_homepage flag set.")
    else:
        print(f"✅ Found {len(homepage_products)} homepage products.")
        
    if not best_sellers or len(best_sellers) == 0:
        print("❌ No best sellers found. Check if products have best_seller flag set.")
    else:
        print(f"✅ Found {len(best_sellers)} best seller products.")
    
    print("\nAPI Test Complete!")

if __name__ == "__main__":
    main()
