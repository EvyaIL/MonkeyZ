#!/usr/bin/env python3
"""
Debug coupon max usage issue
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_coupon_max_usage():
    """Debug coupon max usage validation"""
    
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        
        # Access admin database where coupons are stored
        admin_db = client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        # Access main database for orders
        main_db = client.get_database("MonkeyZ")
        orders_collection = main_db.get_collection("orders")
        
        print("🔍 DEBUG: Coupon Max Usage Issue")
        print("=" * 50)
        
        # Get all active coupons
        active_coupons = await coupons_collection.find({'active': True}).to_list(None)
        print(f"\n📋 Found {len(active_coupons)} active coupons:")
        
        for coupon in active_coupons:
            code = coupon.get('code')
            max_uses = coupon.get('maxUses')
            max_per_user = coupon.get('maxUsagePerUser')
            usage_count = coupon.get('usageCount', 0)
            user_usages = coupon.get('userUsages', {})
            
            print(f"\n🎫 Coupon: {code}")
            print(f"   📊 Max Uses: {max_uses}")
            print(f"   👤 Max Per User: {max_per_user}")
            print(f"   🔢 Stored Usage Count: {usage_count}")
            print(f"   📋 User Usages: {user_usages}")
            
            # Count real orders with this coupon
            real_count = await orders_collection.count_documents({
                '$or': [
                    {'couponCode': {'$regex': f'^{code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            print(f"   🎯 Real Orders Count: {real_count}")
            
            # Check if this coupon should be blocked due to max usage
            should_be_blocked = False
            block_reason = ""
            
            if max_uses is not None and max_uses > 0:
                if real_count >= max_uses:
                    should_be_blocked = True
                    block_reason = f"Total usage limit exceeded ({real_count}/{max_uses})"
                elif usage_count >= max_uses:
                    should_be_blocked = True
                    block_reason = f"Stored usage limit exceeded ({usage_count}/{max_uses})"
            
            if should_be_blocked:
                print(f"   ❌ SHOULD BE BLOCKED: {block_reason}")
            else:
                print(f"   ✅ Should be valid")
            
            # Show recent orders with this coupon
            recent_orders = await orders_collection.find({
                '$or': [
                    {'couponCode': {'$regex': f'^{code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            }).limit(5).to_list(None)
            
            if recent_orders:
                print(f"   📝 Recent Orders ({len(recent_orders)}):")
                for order in recent_orders:
                    print(f"      - {order.get('_id')} | {order.get('userEmail', order.get('email', 'NO EMAIL'))} | {order.get('status')}")
        
        # Test validation of a specific coupon
        print(f"\n🧪 Testing Validation Logic")
        print("=" * 30)
        
        test_coupon = 'test7'  # Change this to test different coupons
        test_email = 'test@example.com'
        test_amount = 100
        
        coupon = await coupons_collection.find_one({'code': test_coupon, 'active': True})
        if coupon:
            print(f"Testing coupon: {test_coupon}")
            
            # Check max uses
            max_uses = coupon.get('maxUses')
            if max_uses is not None:
                real_count = await orders_collection.count_documents({
                    '$or': [
                        {'couponCode': {'$regex': f'^{test_coupon}$', '$options': 'i'}},
                        {'coupon_code': {'$regex': f'^{test_coupon}$', '$options': 'i'}}
                    ],
                    'status': {'$nin': ['cancelled', 'failed']}
                })
                
                print(f"Max uses check: {real_count}/{max_uses}")
                if real_count >= max_uses:
                    print("❌ BLOCKED: Total usage limit reached")
                else:
                    print("✅ PASSED: Within total usage limit")
            
            # Check per-user limit
            max_per_user = coupon.get('maxUsagePerUser', 0)
            if max_per_user > 0 and test_email:
                user_orders = await orders_collection.count_documents({
                    '$and': [
                        {
                            '$or': [
                                {'userEmail': {'$regex': f'^{test_email}$', '$options': 'i'}},
                                {'email': {'$regex': f'^{test_email}$', '$options': 'i'}},
                                {'customerEmail': {'$regex': f'^{test_email}$', '$options': 'i'}}
                            ]
                        },
                        {
                            '$or': [
                                {'couponCode': {'$regex': f'^{test_coupon}$', '$options': 'i'}},
                                {'coupon_code': {'$regex': f'^{test_coupon}$', '$options': 'i'}}
                            ]
                        },
                        {
                            'status': {'$nin': ['cancelled', 'failed']}
                        }
                    ]
                })
                
                print(f"Per-user check: {user_orders}/{max_per_user} for {test_email}")
                if user_orders >= max_per_user:
                    print("❌ BLOCKED: Per-user usage limit reached")
                else:
                    print("✅ PASSED: Within per-user usage limit")
        else:
            print(f"❌ Coupon '{test_coupon}' not found or not active")
        
        client.close()
        
    except Exception as e:
        logger.error(f"Error during debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_coupon_max_usage())
