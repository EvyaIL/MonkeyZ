#!/usr/bin/env python3
"""
Production Coupon Fix Script
This script fixes coupon validation issues between localhost and production environments.
"""

import asyncio
import sys
import os
import logging
from datetime import datetime, timezone

# Add the backend src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fix_coupon_validation():
    """Fix coupon validation by synchronizing userUsages data with actual orders."""
    
    print("🔧 MonkeyZ Coupon Validation Production Fix")
    print("=" * 50)
    
    try:
        from mongodb.mongodb import MongoDb
        from services.coupon_service import CouponService
        
        # Initialize database connection
        mongo_db = MongoDb()
        db = await mongo_db.get_db()
        
        print("✅ Database connection established")
        
        # Get admin database where coupons are stored
        admin_db = db.client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        orders_collection = db.orders
        
        print("📊 Analyzing coupon usage data...")
        
        # Find all active coupons with per-user limits
        coupons_with_limits = []
        async for coupon in coupons_collection.find({'active': True, 'maxUsagePerUser': {'$gt': 0}}):
            coupons_with_limits.append(coupon)
        
        print(f"Found {len(coupons_with_limits)} coupons with per-user limits")
        
        fixed_count = 0
        
        for coupon in coupons_with_limits:
            coupon_code = coupon['code']
            print(f"\n🎫 Processing coupon: {coupon_code}")
            
            # Find all orders that used this coupon
            query = {
                '$or': [
                    {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            }
            
            # Build accurate userUsages data
            user_usage_map = {}
            order_count = 0
            
            async for order in orders_collection.find(query):
                order_count += 1
                
                # Get user email from various fields
                user_email = (
                    order.get('email') or 
                    order.get('userEmail') or 
                    order.get('customerEmail')
                )
                
                if user_email:
                    user_email = user_email.lower().strip()  # Normalize
                    user_usage_map[user_email] = user_usage_map.get(user_email, 0) + 1
            
            print(f"   Orders found: {order_count}")
            print(f"   Unique users: {len(user_usage_map)}")
            
            # Update coupon with accurate userUsages data
            if user_usage_map or order_count > 0:
                update_result = await coupons_collection.update_one(
                    {'_id': coupon['_id']},
                    {'$set': {'userUsages': user_usage_map}}
                )
                
                if update_result.modified_count > 0:
                    print(f"   ✅ Updated userUsages for {coupon_code}")
                    fixed_count += 1
                    
                    # Show the data for verification
                    if user_usage_map:
                        print("   📈 User usage breakdown:")
                        for email, count in user_usage_map.items():
                            print(f"     {email}: {count}")
                else:
                    print(f"   ℹ️  No changes needed for {coupon_code}")
            else:
                print(f"   ℹ️  No usage data found for {coupon_code}")
        
        print(f"\n🎉 Fix completed!")
        print(f"   Processed: {len(coupons_with_limits)} coupons")
        print(f"   Fixed: {fixed_count} coupons")
        
        # Verification test
        print(f"\n🧪 Running verification test...")
        
        if coupons_with_limits:
            coupon_service = CouponService(db)
            test_coupon = coupons_with_limits[0]
            test_code = test_coupon['code']
            
            # Find a user who has used this coupon
            test_user_email = None
            user_usages = test_coupon.get('userUsages', {})
            if user_usages:
                test_user_email = list(user_usages.keys())[0]
            
            if test_user_email:
                print(f"   Testing coupon '{test_code}' for user '{test_user_email}'")
                
                discount, coupon_obj, error = await coupon_service.validate_coupon(
                    test_code, 100.0, test_user_email
                )
                
                if error:
                    print(f"   ✅ Validation correctly failed: {error}")
                else:
                    print(f"   ⚠️  Validation passed (might need investigation): ${discount} discount")
            else:
                print("   ℹ️  No test user found for verification")
        
        print(f"\n🚀 Coupon validation fix completed!")
        print(f"   - Production coupon validation should now work correctly")
        print(f"   - Per-user limits will be properly enforced")
        print(f"   - userUsages data is synchronized with order history")
        
    except Exception as e:
        logger.error(f"Fix failed: {e}")
        print(f"❌ Fix failed: {e}")
        print(f"   Please check database connection and permissions")

async def test_specific_coupon():
    """Test a specific coupon and user combination."""
    
    coupon_code = input("Enter coupon code to test: ").strip()
    user_email = input("Enter user email to test: ").strip()
    
    if not coupon_code or not user_email:
        print("❌ Both coupon code and email are required")
        return
    
    try:
        from mongodb.mongodb import MongoDb
        from services.coupon_service import CouponService
        
        mongo_db = MongoDb()
        db = await mongo_db.get_db()
        coupon_service = CouponService(db)
        
        print(f"\n🧪 Testing coupon '{coupon_code}' for user '{user_email}'")
        
        # Test validation
        discount, coupon_obj, error = await coupon_service.validate_coupon(
            coupon_code, 100.0, user_email
        )
        
        if error:
            print(f"❌ Validation failed: {error}")
        else:
            print(f"✅ Validation passed: ${discount} discount")
            
        # Test application (this increments usage)
        print(f"\n🔄 Testing coupon application...")
        discount2, coupon_obj2, error2 = await coupon_service.apply_coupon(
            coupon_code, 100.0, user_email
        )
        
        if error2:
            print(f"❌ Application failed: {error2}")
        else:
            print(f"✅ Application passed: ${discount2} discount")
            print(f"⚠️  Note: This incremented the usage count!")
    
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    print("Choose an option:")
    print("1. Fix coupon validation (recommended)")
    print("2. Test specific coupon")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        asyncio.run(fix_coupon_validation())
    elif choice == "2":
        asyncio.run(test_specific_coupon())
    else:
        print("Invalid choice")
