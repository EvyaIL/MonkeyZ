#!/usr/bin/env python
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"  # Adjust if your server is on a different port
USERNAME = "admin"  # Replace with actual admin username
PASSWORD = "admin"  # Replace with actual admin password

def login():
    """Log in to get an access token"""
    login_url = f"{BASE_URL}/user/login"
    response = requests.post(
        login_url,
        data={
            "username": USERNAME,
            "password": PASSWORD
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )
    
    if response.status_code != 200:
        print(f"Login failed with status code {response.status_code}")
        print(response.text)
        return None
    
    data = response.json()
    print("Login successful!")
    return data["access_token"]

def get_all_coupons(token):
    """Get all coupons using the provided token"""
    coupons_url = f"{BASE_URL}/admin/coupons"
    response = requests.get(
        coupons_url,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if response.status_code != 200:
        print(f"Failed to get coupons: {response.status_code}")
        print(response.text)
        return None
    
    coupons = response.json()
    print(f"Successfully retrieved {len(coupons)} coupons")
    return coupons

def create_coupon(token):
    """Create a new coupon"""
    coupon_url = f"{BASE_URL}/admin/coupons"
    
    # Create a test coupon with required fields
    expires_at = (datetime.utcnow() + timedelta(days=30)).isoformat()
    coupon_data = {
        "code": f"TEST{datetime.now().strftime('%Y%m%d%H%M%S')}",  # Unique code
        "discountPercent": 20.0,
        "active": True,
        "expiresAt": expires_at,
        "maxUses": 100
    }
    
    response = requests.post(
        coupon_url,
        json=coupon_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code != 200:
        print(f"Failed to create coupon: {response.status_code}")
        print(response.text)
        return None
    
    new_coupon = response.json()
    print(f"Successfully created coupon with code: {new_coupon['code']}")
    return new_coupon

def update_coupon(token, coupon_id):
    """Update an existing coupon"""
    coupon_url = f"{BASE_URL}/admin/coupons/{coupon_id}"
    
    update_data = {
        "discountPercent": 25.0,
        "active": True
    }
    
    response = requests.patch(
        coupon_url,
        json=update_data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    
    if response.status_code != 200:
        print(f"Failed to update coupon: {response.status_code}")
        print(response.text)
        return None
    
    updated_coupon = response.json()
    print(f"Successfully updated coupon with id: {coupon_id}")
    return updated_coupon

def delete_coupon(token, coupon_id):
    """Delete a coupon"""
    coupon_url = f"{BASE_URL}/admin/coupons/{coupon_id}"
    
    response = requests.delete(
        coupon_url,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if response.status_code != 200:
        print(f"Failed to delete coupon: {response.status_code}")
        print(response.text)
        return False
    
    print(f"Successfully deleted coupon with id: {coupon_id}")
    return True

def main():
    """Main test function"""
    # Login to get a token
    token = login()
    if not token:
        print("Cannot proceed without a valid token.")
        return
    
    # First get all existing coupons
    existing_coupons = get_all_coupons(token)
    
    # Create a new coupon
    new_coupon = create_coupon(token)
    if not new_coupon:
        print("Failed to create a test coupon.")
        return
    
    # Get updated coupon list
    updated_coupons = get_all_coupons(token)
    
    # Update the coupon we just created
    updated_coupon = update_coupon(token, new_coupon["id"])
    if not updated_coupon:
        print("Failed to update the test coupon.")
    
    # Delete the test coupon (uncomment if you want to clean up)
    # delete_result = delete_coupon(token, new_coupon["id"])
    
    print("\nTest completed!")
    
if __name__ == "__main__":
    main()
