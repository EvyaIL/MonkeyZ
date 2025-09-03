#!/usr/bin/env python3
"""
Test script to verify the two specific coupon fixes:
1. Max usage validation
2. Email requirement for per-user coupons
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import requests
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_specific_coupon_fixes():
    """Test the two specific issues that were reported"""
    
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        
        # Access admin database where coupons are stored
        admin_db = client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        # Access main database for orders
        main_db = client.get_database("MonkeyZ")
        orders_collection = main_db.get_collection("orders")
        
        print("🧪 TESTING: Specific Coupon Fixes")
        print("=" * 50)
        
        # Clean up any test data first
        test_coupon_codes = ["TESTMAXFIX", "TESTEMAILFIX"]
        for code in test_coupon_codes:
            await coupons_collection.delete_many({'code': code})
            await orders_collection.delete_many({
                '$or': [
                    {'couponCode': code},
                    {'coupon_code': code}
                ]
            })
        
        # Test 1: Create a coupon that should be blocked due to max usage
        print("\n🔬 TEST 1: Max Usage Validation")
        print("-" * 30)
        
        max_usage_coupon = {
            'code': 'TESTMAXFIX',
            'active': True,
            'discountType': 'percentage',
            'discountValue': 10,
            'maxUses': 1,  # Only 1 use allowed
            'usageCount': 0,
            'userUsages': {},
            'createdAt': datetime.utcnow()
        }
        
        coupon_result = await coupons_collection.insert_one(max_usage_coupon)
        print(f"✅ Created test coupon: TESTMAXFIX (max 1 use)")
        
        # Create 2 orders to exceed the limit
        for i in range(2):
            order = {
                'orderIdRealistic': f'MAXTEST_{i+1}',
                'email': f'user{i+1}@test.com',
                'couponCode': 'TESTMAXFIX',
                'status': 'confirmed',
                'total': 100,
                'discount': 10,
                'createdAt': datetime.utcnow()
            }
            await orders_collection.insert_one(order)
            print(f"✅ Created order {i+1} with coupon")
        
        # Test API validation - should be blocked
        backend_url = "http://localhost:8000"
        try:
            response = requests.post(f"{backend_url}/api/coupons/validate", 
                json={
                    "code": "TESTMAXFIX",
                    "amount": 100,
                    "email": "test@example.com"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                is_valid = data.get('valid', True) and not data.get('error') and data.get('discount', 0) > 0
                
                print(f"API Response: {data}")
                
                if is_valid:
                    print("❌ FAIL: Coupon should be blocked but API says it's valid!")
                    print("   This means Fix #1 (max usage validation) is NOT working")
                else:
                    print("✅ PASS: Coupon correctly blocked due to max usage")
                    print("   Fix #1 (max usage validation) is working!")
            else:
                print(f"⚠️ API Error: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Cannot connect to backend: {e}")
        
        # Test 2: Create a coupon with per-user limits
        print("\n🔬 TEST 2: Email Requirement for Per-User Coupons")
        print("-" * 30)
        
        email_required_coupon = {
            'code': 'TESTEMAILFIX',
            'active': True,
            'discountType': 'percentage',
            'discountValue': 15,
            'maxUses': 100,  # High max usage
            'maxUsagePerUser': 1,  # But only 1 per user - should require email
            'usageCount': 0,
            'userUsages': {},
            'createdAt': datetime.utcnow()
        }
        
        coupon_result2 = await coupons_collection.insert_one(email_required_coupon)
        print(f"✅ Created test coupon: TESTEMAILFIX (requires email, 1 per user)")
        
        # Test without email - should be blocked/require email
        try:
            response = requests.post(f"{backend_url}/api/coupons/validate", 
                json={
                    "code": "TESTEMAILFIX",
                    "amount": 100,
                    "email": None  # No email provided
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                is_valid = data.get('valid', True) and not data.get('error') and data.get('discount', 0) > 0
                
                print(f"API Response (no email): {data}")
                
                if is_valid:
                    print("❌ FAIL: Coupon should require email but API allowed it!")
                    print("   This means Fix #2 (email requirement) is NOT working")
                else:
                    error_msg = data.get('message', '') or data.get('error', '')
                    if 'email' in error_msg.lower():
                        print("✅ PASS: Coupon correctly requires email")
                        print("   Fix #2 (email requirement) is working!")
                    else:
                        print(f"⚠️ PARTIAL: Coupon blocked but not for email reason: {error_msg}")
            else:
                print(f"⚠️ API Error: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Cannot connect to backend: {e}")
        
        # Test with email - should work
        try:
            response = requests.post(f"{backend_url}/api/coupons/validate", 
                json={
                    "code": "TESTEMAILFIX",
                    "amount": 100,
                    "email": "test@example.com"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                is_valid = data.get('valid', True) and not data.get('error') and data.get('discount', 0) > 0
                
                print(f"API Response (with email): {data}")
                
                if is_valid:
                    print("✅ PASS: Coupon works when email is provided")
                else:
                    print("⚠️ UNEXPECTED: Coupon should work with email but was blocked")
            
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Cannot connect to backend: {e}")
        
        # Clean up test data
        print(f"\n🧹 Cleaning up test data...")
        for code in test_coupon_codes:
            await coupons_collection.delete_many({'code': code})
            await orders_collection.delete_many({
                '$or': [
                    {'couponCode': code},
                    {'coupon_code': code}
                ]
            })
        print(f"✅ Test data cleaned up")
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_specific_coupon_fixes())
