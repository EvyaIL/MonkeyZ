#!/usr/bin/env python3
"""
Quick debug script to check current coupon issues
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_current_coupon_issues():
    """Debug the specific issues reported"""
    
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
        
        # Access admin database where coupons are stored
        admin_db = client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        # Access main database for orders
        main_db = client.get_database("MonkeyZ")
        orders_collection = main_db.get_collection("orders")
        
        print("🔍 DEBUGGING: Current Coupon Issues")
        print("=" * 50)
        
        # Get all active coupons
        active_coupons = await coupons_collection.find({'active': True}).to_list(None)
        print(f"\n📋 Found {len(active_coupons)} active coupons")
        
        for coupon in active_coupons:
            code = coupon.get('code')
            max_uses = coupon.get('maxUses')
            max_per_user = coupon.get('maxUsagePerUser', 0)
            usage_count = coupon.get('usageCount', 0)
            
            print(f"\n🎫 Coupon: {code}")
            print(f"   Max Uses: {max_uses}")
            print(f"   Max Per User: {max_per_user}")
            print(f"   Stored Usage Count: {usage_count}")
            
            # Count real orders - exactly like the backend does
            real_count = await orders_collection.count_documents({
                '$or': [
                    {'couponCode': {'$regex': f'^{code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            print(f"   Real Orders Count: {real_count}")
            
            # Check if this should be blocked
            should_be_blocked = False
            block_reason = ""
            
            if max_uses is not None and max_uses > 0:
                if real_count >= max_uses:
                    should_be_blocked = True
                    block_reason = f"Max usage exceeded: {real_count}/{max_uses}"
            
            if should_be_blocked:
                print(f"   ❌ SHOULD BE BLOCKED: {block_reason}")
                
                # Show some recent orders to verify
                recent_orders = await orders_collection.find({
                    '$or': [
                        {'couponCode': {'$regex': f'^{code}$', '$options': 'i'}},
                        {'coupon_code': {'$regex': f'^{code}$', '$options': 'i'}}
                    ],
                    'status': {'$nin': ['cancelled', 'failed']}
                }).limit(3).to_list(None)
                
                print(f"   📋 Recent orders ({len(recent_orders)}):")
                for order in recent_orders:
                    status = order.get('status', 'unknown')
                    email = order.get('email') or order.get('userEmail') or order.get('customerEmail', 'no-email')
                    created = order.get('createdAt', 'unknown')
                    print(f"      - {status} | {email} | {created}")
                    
            else:
                print(f"   ✅ Should be valid (usage: {real_count}/{max_uses if max_uses else 'unlimited'})")
            
            # Check per-user requirement
            if max_per_user > 0:
                print(f"   👤 Requires email for per-user validation (limit: {max_per_user})")
            
        client.close()
        
    except Exception as e:
        logger.error(f"Error during debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_current_coupon_issues())
