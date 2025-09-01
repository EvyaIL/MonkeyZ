#!/usr/bin/env python3
"""
Test script to verify that the coupon max usage fix is working correctly.
This script tests both coupons that should be blocked and ones that should work.
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

async def test_coupon_max_usage_fix():
    """Test the coupon max usage validation fix"""
    
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        
        # Access admin database where coupons are stored
        admin_db = client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        # Access main database for orders
        main_db = client.get_database("MonkeyZ")
        orders_collection = main_db.get_collection("orders")
        
        print("🧪 TESTING: Coupon Max Usage Fix")
        print("=" * 50)
        
        # Test scenarios
        test_scenarios = [
            {
                'name': 'Test Coupon with Max Usage Exceeded',
                'coupon_code': 'TEST_MAX_EXCEEDED',
                'max_uses': 2,
                'should_be_blocked': True
            },
            {
                'name': 'Test Coupon with Max Usage Available', 
                'coupon_code': 'TEST_MAX_AVAILABLE',
                'max_uses': 10,
                'should_be_blocked': False
            },
            {
                'name': 'Test Coupon with Unlimited Usage',
                'coupon_code': 'TEST_UNLIMITED',
                'max_uses': None,
                'should_be_blocked': False
            }
        ]
        
        # First, let's check what real coupons exist and their status
        print("\n📋 EXISTING COUPONS STATUS:")
        print("-" * 30)
        
        active_coupons = await coupons_collection.find({'active': True}).to_list(None)
        for coupon in active_coupons:
            code = coupon.get('code')
            max_uses = coupon.get('maxUses')
            usage_count = coupon.get('usageCount', 0)
            
            # Count real orders
            real_count = await orders_collection.count_documents({
                '$or': [
                    {'couponCode': {'$regex': f'^{code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            print(f"🎫 {code}")
            print(f"   Max Uses: {max_uses}")
            print(f"   Stored Count: {usage_count}")
            print(f"   Real Count: {real_count}")
            
            if max_uses is not None and max_uses > 0:
                if real_count >= max_uses:
                    print(f"   ❌ SHOULD BE BLOCKED (Real: {real_count}/{max_uses})")
                else:
                    print(f"   ✅ Should be valid (Real: {real_count}/{max_uses})")
            else:
                print(f"   ♾️  Unlimited usage")
            print()
        
        # Test API validation for existing coupons
        print("\n🔬 TESTING API VALIDATION:")
        print("-" * 30)
        
        backend_url = "http://localhost:8000"  # Adjust if needed
        
        for coupon in active_coupons[:3]:  # Test first 3 coupons
            code = coupon.get('code')
            max_uses = coupon.get('maxUses')
            
            # Count real orders
            real_count = await orders_collection.count_documents({
                '$or': [
                    {'couponCode': {'$regex': f'^{code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            # Determine expected result
            should_be_blocked = False
            if max_uses is not None and max_uses > 0 and real_count >= max_uses:
                should_be_blocked = True
            
            print(f"Testing coupon: {code}")
            print(f"Real usage: {real_count}, Max: {max_uses}")
            print(f"Expected: {'BLOCKED' if should_be_blocked else 'VALID'}")
            
            try:
                # Test API validation
                response = requests.post(f"{backend_url}/api/coupons/validate", 
                    json={
                        "code": code,
                        "amount": 100,
                        "email": "test@example.com"
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    is_valid = data.get('valid', True) and not data.get('error') and data.get('discount', 0) > 0
                    
                    print(f"API Response: {data}")
                    
                    if should_be_blocked:
                        if is_valid:
                            print("❌ FAIL: Coupon should be blocked but API says it's valid!")
                        else:
                            print("✅ PASS: Coupon correctly blocked")
                    else:
                        if is_valid:
                            print("✅ PASS: Coupon correctly valid")
                        else:
                            print("❌ FAIL: Coupon should be valid but API says it's blocked!")
                else:
                    print(f"⚠️ API Error: HTTP {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"⚠️ Cannot connect to backend: {e}")
                print("   (Make sure the backend server is running)")
            
            print("-" * 20)
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_coupon_max_usage_fix())
