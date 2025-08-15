import requests

try:
    response = requests.get("http://localhost:8000/api/products")
    if response.status_code == 200:
        products = response.json()
        if products:
            first_product = products[0]
            print(f"First product ID: {first_product.get('_id') or first_product.get('id')}")
            print(f"Product name: {first_product.get('name')}")
        else:
            print("No products found")
    else:
        print(f"Failed to get products: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
