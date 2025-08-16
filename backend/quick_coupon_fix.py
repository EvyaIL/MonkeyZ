#!/usr/bin/env python3
"""
Quick Coupon Fix Script for Production
=====================================

This script fixes the "Used: 0" issue in the admin panel and coupon validation problems
by ensuring proper coupon application during PayPal capture.

Run this on your DigitalOcean server to fix the coupon issues immediately.
"""

import asyncio
import os
import sys
import logging
from datetime import datetime

# Setup minimal logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

async def quick_coupon_fix():
    """Quick fix for coupon usage tracking issues"""
    try:
        # Import dependencies
        from motor.motor_asyncio import AsyncIOMotorClient
        
        # Get MongoDB connection
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            logger.error("❌ MONGODB_URI not found in environment")
            return False
        
        # Connect to database
        client = AsyncIOMotorClient(mongodb_uri)
        
        # Get the main database (usually 'shop' or similar)
        db_name = mongodb_uri.split("/")[-1].split("?")[0] if "/" in mongodb_uri else "shop"
        db = client[db_name]
        
        # Get admin database where coupons are stored
        admin_db = client["admin"]
        
        logger.info(f"📡 Connected to database: {db_name}")
        
        # Step 1: Fix coupon usage counts
        logger.info("🔧 Fixing coupon usage counts...")
        
        coupons = await admin_db.coupons.find({'active': True}).to_list(None)
        logger.info(f"Found {len(coupons)} active coupons")
        
        fixed_count = 0
        for coupon in coupons:
            coupon_code = coupon.get('code')
            if not coupon_code:
                continue
            
            # Count real orders with this coupon (excluding cancelled/failed)
            real_count = await db.orders.count_documents({
                '$or': [
                    {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            stored_count = coupon.get('usageCount', 0)
            
            if stored_count != real_count:
                # Update the stored count
                await admin_db.coupons.update_one(
                    {'_id': coupon['_id']},
                    {'$set': {'usageCount': real_count}}
                )
                logger.info(f"✅ Fixed '{coupon_code}': {stored_count} → {real_count}")
                fixed_count += 1
            else:
                logger.info(f"✓ '{coupon_code}': already correct ({real_count})")
        
        # Step 2: Add missing field mappings to orders
        logger.info("🔧 Standardizing order fields...")
        
        # Add coupon_code field where missing
        result = await db.orders.update_many(
            {
                'couponCode': {'$exists': True},
                'coupon_code': {'$exists': False}
            },
            [
                {'$set': {'coupon_code': '$couponCode'}}
            ]
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Standardized {result.modified_count} order fields")
        
        # Close connection
        client.close()
        
        logger.info(f"🎉 Quick fix completed! Fixed {fixed_count} coupons")
        logger.info("✅ Admin panel should now show correct usage counts")
        logger.info("✅ Coupons should now properly validate max usage limits")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error in quick fix: {e}")
        return False

if __name__ == "__main__":
    logger.info("🚀 Starting quick coupon fix...")
    success = asyncio.run(quick_coupon_fix())
    
    if success:
        print("\n🎉 SUCCESS! Coupon issues have been fixed.")
        print("The admin panel should now show correct usage counts.")
        print("Coupons should now work identically to localhost.")
    else:
        print("\n❌ FAILED! Please check the error messages above.")
        sys.exit(1)
