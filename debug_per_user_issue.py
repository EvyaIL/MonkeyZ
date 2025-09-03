#!/usr/bin/env python3
"""
Debug script to examine why per-user coupon limits aren't working
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from motor.motor_asyncio import AsyncIOMotorClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_test5_coupon():
    """Debug the test5 coupon that's allowing exceeded per-user usage"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # Check admin database for coupons
    admin_db = client.admin
    coupons_collection = admin_db.coupons
    
    # Check main database for orders
    main_db = client.MonkeyZ
    orders_collection = main_db.orders
    
    print("=== DEBUGGING TEST5 COUPON ===\n")
    
    # 1. Get the coupon details
    coupon = await coupons_collection.find_one({'code': {'$regex': '^test5$', '$options': 'i'}})
    if not coupon:
        print("❌ Coupon 'test5' not found!")
        return
    
    print("1. COUPON DETAILS:")
    print(f"   Code: {coupon.get('code')}")
    print(f"   Active: {coupon.get('active')}")
    print(f"   Max Uses: {coupon.get('maxUses')}")
    print(f"   Max Uses Per User: {coupon.get('maxUsagePerUser')}")
    print(f"   Stored Usage Count: {coupon.get('usageCount', 0)}")
    print(f"   Discount Type: {coupon.get('discountType')}")
    print(f"   Discount Value: {coupon.get('discountValue')}")
    print()
    
    # 2. Get all orders with this coupon
    test_email = "mrbrownaffiliate@gmail.com"
    
    print("2. OVERALL USAGE CHECK:")
    overall_query = {
        '$and': [
            {
                '$or': [
                    {'couponCode': {'$regex': '^test5$', '$options': 'i'}},
                    {'coupon_code': {'$regex': '^test5$', '$options': 'i'}}
                ]
            },
            {
                'status': {'$nin': ['cancelled', 'failed']}
            }
        ]
    }
    
    overall_orders = await orders_collection.find(overall_query).to_list(None)
    print(f"   Total active orders with test5: {len(overall_orders)}")
    for order in overall_orders:
        email = order.get('email') or order.get('userEmail') or order.get('customerEmail') or 'NO_EMAIL'
        print(f"   - Order {order.get('_id')}: email={email}, status={order.get('status')}, coupon={order.get('couponCode', order.get('coupon_code'))}")
    print()
    
    # 3. Get per-user usage for specific email
    print("3. PER-USER USAGE CHECK:")
    per_user_query = {
        '$and': [
            {
                '$or': [
                    {'userEmail': {'$regex': f'^{test_email}$', '$options': 'i'}},
                    {'email': {'$regex': f'^{test_email}$', '$options': 'i'}},
                    {'customerEmail': {'$regex': f'^{test_email}$', '$options': 'i'}},
                ]
            },
            {
                '$or': [
                    {'couponCode': {'$regex': '^test5$', '$options': 'i'}},
                    {'coupon_code': {'$regex': '^test5$', '$options': 'i'}}
                ]
            },
            {
                'status': {'$nin': ['cancelled', 'failed']}
            }
        ]
    }
    
    user_orders = await orders_collection.find(per_user_query).to_list(None)
    print(f"   Orders for {test_email}: {len(user_orders)}")
    for order in user_orders:
        email = order.get('email') or order.get('userEmail') or order.get('customerEmail') or 'NO_EMAIL'
        print(f"   - Order {order.get('_id')}: email={email}, status={order.get('status')}, coupon={order.get('couponCode', order.get('coupon_code'))}")
    print()
    
    # 4. Analysis
    max_per_user = coupon.get('maxUsagePerUser', 0)
    user_count = len(user_orders)
    
    print("4. ANALYSIS:")
    print(f"   Max uses per user: {max_per_user}")
    print(f"   Actual uses by {test_email}: {user_count}")
    print(f"   Should be blocked: {user_count >= max_per_user if max_per_user > 0 else False}")
    print()
    
    if max_per_user > 0 and user_count >= max_per_user:
        print("❌ BUG CONFIRMED: User has exceeded limit but coupon still works!")
        print("   This indicates the validation logic is not working correctly.")
    else:
        print("✅ Usage appears to be within limits")
    
    # 5. Test the CouponService validation directly
    print("5. TESTING COUPON SERVICE VALIDATION:")
    try:
        # Import and test the CouponService
        from services.coupon_service import CouponService
        
        coupon_service = CouponService(main_db)
        discount, coupon_obj, error = await coupon_service.validate_coupon('test5', 100.0, test_email)
        
        print(f"   CouponService.validate_coupon result:")
        print(f"   - Discount: {discount}")
        print(f"   - Error: {error}")
        print(f"   - Should be blocked: {error is not None}")
        
        if error:
            print("✅ CouponService correctly blocks the coupon")
        else:
            print("❌ CouponService incorrectly allows the coupon")
            
    except Exception as e:
        print(f"   Error testing CouponService: {e}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(debug_test5_coupon())
