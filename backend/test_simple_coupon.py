import requests
import json

# Test the coupon validation endpoint
url = "http://localhost:8000/api/coupons/validate"
data = {
    "code": "test4",
    "amount": 5,
    "email": "evyatarhypixel1477@gmail.com"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
