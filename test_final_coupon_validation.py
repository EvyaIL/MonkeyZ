#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE COUPON VALIDATION TEST
Tests all the fixes we've implemented for the per-user max usage issue.
"""
import asyncio
import sys
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the backend src to the path
backend_src_path = os.path.join(os.path.dirname(__file__), 'backend', 'src')
if backend_src_path not in sys.path:
    sys.path.insert(0, backend_src_path)

from services.coupon_service import CouponService

async def test_coupon_validation():
    """Test the fixed coupon validation logic"""
    
    # MongoDB connection
    MONGO_URI = "mongodb://admin:r0sGGKPCdVAcqCqPZaKHkTTLzg@188.245.85.44:27017/admin"
    client = AsyncIOMotorClient(MONGO_URI)
    
    # Get both databases
    admin_db = client.admin
    main_db = client.MonkeyZ
    
    # Initialize coupon service with admin database for coupons
    coupon_service = CouponService(admin_db)
    coupon_service.db = main_db  # Override for orders access
    
    print("🚀 COMPREHENSIVE COUPON VALIDATION TEST")
    print("=" * 50)
    
    # Test case: test11 coupon with mrbrownaffiliate@gmail.com
    test_email = "mrbrownaffiliate@gmail.com"
    test_coupon = "test11"
    
    print(f"\n📧 Testing: {test_email}")
    print(f"🎫 Coupon: {test_coupon}")
    
    try:
        # Step 1: Check coupon exists
        print("\n1️⃣ CHECKING COUPON EXISTS...")
        coupons = admin_db.coupons
        coupon = await coupons.find_one({"code": {"$regex": f"^{test_coupon}$", "$options": "i"}})
        
        if not coupon:
            print(f"❌ Coupon '{test_coupon}' not found!")
            return
        
        print(f"✅ Found coupon: {coupon['code']}")
        print(f"   Max usage: {coupon.get('maxUsage', 'unlimited')}")
        print(f"   Max per user: {coupon.get('maxUsagePerUser', 'unlimited')}")
        print(f"   Active: {coupon.get('active', False)}")
        
        # Step 2: Get user usage count with our enhanced method
        print("\n2️⃣ CHECKING USER USAGE COUNT...")
        user_count = await coupon_service.get_user_usage_count(test_coupon, test_email)
        max_per_user = coupon.get('maxUsagePerUser', float('inf'))
        
        print(f"   User count: {user_count}")
        print(f"   Max per user: {max_per_user}")
        print(f"   Limit exceeded: {user_count >= max_per_user}")
        
        # Step 3: Test validation
        print("\n3️⃣ TESTING VALIDATION...")
        validation_result = await coupon_service.validate_coupon(test_coupon, test_email)
        
        print(f"   Validation result: {validation_result}")
        
        # Step 4: Expected vs Actual
        print("\n4️⃣ ANALYSIS")
        if user_count >= max_per_user:
            expected = "SHOULD REJECT (user exceeded limit)"
            if validation_result.get('valid') == False:
                actual = "✅ CORRECTLY REJECTED"
                status = "PASS"
            else:
                actual = "❌ INCORRECTLY ALLOWED"
                status = "FAIL"
        else:
            expected = "SHOULD ALLOW (under limit)"
            if validation_result.get('valid') == True:
                actual = "✅ CORRECTLY ALLOWED"
                status = "PASS"
            else:
                actual = "❌ INCORRECTLY REJECTED"
                status = "FAIL"
        
        print(f"   Expected: {expected}")
        print(f"   Actual: {actual}")
        print(f"   Status: {status}")
        
        # Step 5: Additional debugging - look at raw orders
        print("\n5️⃣ RAW DATABASE VERIFICATION")
        orders_collection = main_db.orders
        
        # Find all orders for this user with this coupon
        all_orders = await orders_collection.find({
            '$and': [
                {
                    '$or': [
                        {'email': {'$regex': f'^{test_email}$', '$options': 'i'}},
                        {'userEmail': {'$regex': f'^{test_email}$', '$options': 'i'}},
                        {'customerEmail': {'$regex': f'^{test_email}$', '$options': 'i'}}
                    ]
                },
                {
                    '$or': [
                        {'couponCode': {'$regex': f'^{test_coupon}$', '$options': 'i'}},
                        {'coupon_code': {'$regex': f'^{test_coupon}$', '$options': 'i'}}
                    ]
                },
                {'status': {'$nin': ['cancelled', 'failed']}}
            ]
        }).to_list(None)
        
        print(f"   Raw query found {len(all_orders)} orders")
        for i, order in enumerate(all_orders, 1):
            order_id = order.get('_id')
            email = order.get('email') or order.get('userEmail') or order.get('customerEmail')
            coupon = order.get('couponCode') or order.get('coupon_code')
            status = order.get('status')
            created = order.get('createdAt', 'unknown')
            print(f"   Order {i}: {order_id} | {email} | {coupon} | {status} | {created}")
        
        print(f"\n🎯 FINAL RESULT: {status}")
        
        if status == "FAIL":
            print("\n🔧 DEBUGGING INFO:")
            print("   - Check backend logs for detailed validation flow")
            print("   - Verify coupon service is using correct database")
            print("   - Ensure email matching is working properly")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_coupon_validation())
