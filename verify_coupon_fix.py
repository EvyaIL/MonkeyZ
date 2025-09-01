#!/usr/bin/env python3
"""
Simple verification script to test the coupon max usage fix.
This creates a test coupon and simulates orders to test the validation.
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import logging
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_coupon_fix():
    """Create a test scenario and verify the fix works"""
    
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        
        # Access admin database where coupons are stored
        admin_db = client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        # Access main database for orders
        main_db = client.get_database("MonkeyZ")
        orders_collection = main_db.get_collection("orders")
        
        print("🔧 VERIFYING: Coupon Max Usage Fix")
        print("=" * 40)
        
        # Create a test coupon with max usage of 2
        test_coupon_code = "TESTFIX2024"
        
        # First, clean up any existing test data
        await coupons_collection.delete_many({'code': test_coupon_code})
        await orders_collection.delete_many({
            '$or': [
                {'couponCode': test_coupon_code},
                {'coupon_code': test_coupon_code}
            ]
        })
        
        # Create test coupon
        test_coupon = {
            'code': test_coupon_code,
            'active': True,
            'discountType': 'percentage',
            'discountValue': 10,
            'maxUses': 2,  # Only 2 uses allowed
            'usageCount': 0,
            'userUsages': {},
            'createdAt': datetime.utcnow()
        }
        
        coupon_result = await coupons_collection.insert_one(test_coupon)
        print(f"✅ Created test coupon: {test_coupon_code} (max 2 uses)")
        
        # Create 3 test orders to exceed the limit
        test_orders = [
            {
                'orderIdRealistic': f'ORDER_{i+1}',
                'email': f'user{i+1}@test.com',
                'couponCode': test_coupon_code,
                'status': 'confirmed',
                'total': 100,
                'discount': 10,
                'createdAt': datetime.utcnow()
            }
            for i in range(3)  # Create 3 orders (exceeds limit of 2)
        ]
        
        for i, order in enumerate(test_orders):
            order_result = await orders_collection.insert_one(order)
            print(f"✅ Created test order {i+1}: {order['orderIdRealistic']}")
        
        print(f"\n📊 Test scenario created:")
        print(f"   Coupon: {test_coupon_code}")
        print(f"   Max uses: 2")
        print(f"   Actual orders: 3")
        print(f"   Expected result: BLOCKED (usage exceeded)")
        
        # Now test the validation logic directly
        print(f"\n🧪 Testing validation logic...")
        
        # Import the coupon service
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))
        
        from services.coupon_service import CouponService
        
        # Create coupon service instance
        coupon_service = CouponService(main_db)
        
        # Test get_real_usage_count
        real_count = await coupon_service.get_real_usage_count(test_coupon_code)
        print(f"✅ Real usage count: {real_count}")
        
        # Test validate_coupon
        discount, coupon_obj, error = await coupon_service.validate_coupon(
            test_coupon_code, 100, "newuser@test.com"
        )
        
        print(f"\n📋 Validation result:")
        print(f"   Discount: {discount}")
        print(f"   Error: {error}")
        print(f"   Coupon found: {coupon_obj is not None}")
        
        # Verify the result
        if real_count >= 2 and error and "usage limit" in error.lower():
            print("\n✅ SUCCESS: Coupon correctly blocked due to max usage!")
            print(f"   - Real usage ({real_count}) >= max uses (2)")
            print(f"   - Error message: {error}")
        elif real_count >= 2 and not error:
            print("\n❌ FAILURE: Coupon should be blocked but validation passed!")
        else:
            print(f"\n⚠️ UNEXPECTED: Real count = {real_count}, Error = {error}")
        
        # Clean up test data
        print(f"\n🧹 Cleaning up test data...")
        await coupons_collection.delete_one({'_id': coupon_result.inserted_id})
        await orders_collection.delete_many({
            '$or': [
                {'couponCode': test_coupon_code},
                {'coupon_code': test_coupon_code}
            ]
        })
        print(f"✅ Test data cleaned up")
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error during verification: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_coupon_fix())
