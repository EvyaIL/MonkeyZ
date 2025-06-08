import requests

def test_api_endpoint(url):
    """Test an API endpoint and print the response"""
    print(f"\nTesting: {url}")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"Received {len(data)} items")
                if len(data) > 0:
                    print("First item properties:")
                    for key, value in data[0].items():
                        if key in ['is_new', 'isNew', 'best_seller', 'isBestSeller', 'display_on_homepage', 'displayOnHomepage', 'discountPercentage']:
                            print(f"  {key}: {value}")
            else:
                print("Response is not a list")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

# Base URL
base_url = "http://localhost:8000"

# Test all product endpoints
print("=== Testing MonkeyZ Product API Endpoints ===")
test_api_endpoint(f"{base_url}/product/all")
test_api_endpoint(f"{base_url}/product/homepage")
test_api_endpoint(f"{base_url}/product/best-sellers")
test_api_endpoint(f"{base_url}/product/recent")

print("\nAPI tests completed")
