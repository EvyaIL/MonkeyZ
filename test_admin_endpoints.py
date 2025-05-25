#!/usr/bin/env python3
"""
Test script to verify admin endpoints are working
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(endpoint, method="GET", data=None, headers=None):
    """Test an endpoint and return the response"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n{'='*50}")
    print(f"Testing {method} {url}")
    print(f"{'='*50}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
            
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_json = response.json()
            print(f"Response Body: {json.dumps(response_json, indent=2)}")
        except:
            print(f"Response Text: {response.text[:500]}...")
            
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    print("Testing Admin Endpoints")
    
    # Test health check first
    test_endpoint("/")
    
    # Test getting products without auth (should fail)
    test_endpoint("/admin/products")
    
    # Test getting key metrics without auth (should fail)
    test_endpoint("/admin/key-metrics")
    
    # Test creating a product without auth (should fail)
    test_data = {
        "name": "Test Product",
        "description": "Test Description", 
        "price": 99.99,
        "category": "Test",
        "imageUrl": "https://example.com/image.jpg"
    }
    test_endpoint("/admin/products", "POST", test_data)

if __name__ == "__main__":
    main()
