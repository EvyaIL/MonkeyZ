"""
Comprehensive Coupon Debug and Fix Script
This script will identify and fix all coupon usage tracking issues.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(src_dir))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import logging

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CouponDebugger:
    def __init__(self):
        self.client = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB."""
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            raise ValueError("MONGODB_URI not found in environment")
            
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.client.get_database("admin")  # Main database
        
        logger.info("Connected to MongoDB")
        
    async def debug_coupon_usage(self, coupon_code: str = "test3"):
        """Debug a specific coupon's usage tracking."""
        logger.info(f"=== DEBUGGING COUPON: {coupon_code} ===")
        
        # Get coupon from admin.coupons
        admin_db = self.client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        coupon = await coupons_collection.find_one({
            'code': {'$regex': f'^{coupon_code}$', '$options': 'i'}
        })
        
        if not coupon:
            logger.error(f"Coupon '{coupon_code}' not found!")
            return
        
        logger.info(f"Coupon found: {coupon.get('code')}")
        logger.info(f"Stored usageCount: {coupon.get('usageCount', 0)}")
        logger.info(f"Max uses: {coupon.get('maxUses', 'unlimited')}")
        logger.info(f"Active: {coupon.get('active', False)}")
        
        # Get orders using this coupon
        orders_collection = self.db.orders
        
        orders = await orders_collection.find({
            'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}
        }).to_list(None)
        
        logger.info(f"Found {len(orders)} orders using this coupon:")
        
        status_counts = {}
        for order in orders:
            status = order.get('status', 'unknown')
            status_counts[status] = status_counts.get(status, 0) + 1
            
            logger.info(f"  Order {order.get('_id')}: status={status}, email={order.get('userEmail')}")
        
        logger.info(f"Status breakdown: {status_counts}")
        
        # Calculate what the usage count SHOULD be
        active_orders = len([o for o in orders if o.get('status') not in ['cancelled', 'failed']])
        logger.info(f"Active orders (should be usage count): {active_orders}")
        
        # Show the discrepancy
        stored_count = coupon.get('usageCount', 0)
        if stored_count != active_orders:
            logger.warning(f"DISCREPANCY FOUND!")
            logger.warning(f"  Stored usage count: {stored_count}")
            logger.warning(f"  Actual active orders: {active_orders}")
            logger.warning(f"  Difference: {active_orders - stored_count}")
        else:
            logger.info("Usage count is correct!")
            
        return {
            'coupon_code': coupon_code,
            'stored_usage': stored_count,
            'actual_usage': active_orders,
            'orders_found': len(orders),
            'status_counts': status_counts,
            'discrepancy': active_orders - stored_count
        }
    
    async def fix_coupon_usage(self, coupon_code: str = "test3"):
        """Fix the usage count for a specific coupon."""
        logger.info(f"=== FIXING COUPON USAGE: {coupon_code} ===")
        
        # Get real usage count
        orders_collection = self.db.orders
        real_count = await orders_collection.count_documents({
            'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
            'status': {'$nin': ['cancelled', 'failed']}
        })
        
        # Update the coupon
        admin_db = self.client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        result = await coupons_collection.update_one(
            {'code': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
            {'$set': {'usageCount': real_count}}
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Fixed usage count for '{coupon_code}' to {real_count}")
            return True
        else:
            logger.error(f"❌ Failed to update usage count for '{coupon_code}'")
            return False
    
    async def fix_all_coupons(self):
        """Fix usage counts for all coupons."""
        logger.info("=== FIXING ALL COUPON USAGE COUNTS ===")
        
        admin_db = self.client.get_database("admin")
        coupons_collection = admin_db.get_collection("coupons")
        
        # Get all active coupons
        coupons = await coupons_collection.find({'active': True}).to_list(None)
        
        fixed_count = 0
        for coupon in coupons:
            coupon_code = coupon.get('code')
            if not coupon_code:
                continue
                
            # Get real usage count
            orders_collection = self.db.orders
            real_count = await orders_collection.count_documents({
                'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            stored_count = coupon.get('usageCount', 0)
            
            if real_count != stored_count:
                # Update the coupon
                await coupons_collection.update_one(
                    {'_id': coupon['_id']},
                    {'$set': {'usageCount': real_count}}
                )
                
                logger.info(f"Fixed '{coupon_code}': {stored_count} -> {real_count}")
                fixed_count += 1
            else:
                logger.info(f"'{coupon_code}' is already correct: {real_count}")
        
        logger.info(f"✅ Fixed {fixed_count} coupons out of {len(coupons)} total")
        return fixed_count
    
    async def close(self):
        """Close the database connection."""
        if self.client:
            self.client.close()

async def main():
    debugger = CouponDebugger()
    
    try:
        await debugger.connect()
        
        # Debug the test3 coupon specifically
        debug_result = await debugger.debug_coupon_usage("test3")
        print("\n" + "="*50)
        print("DEBUG RESULTS:")
        print(f"Coupon: {debug_result['coupon_code']}")
        print(f"Stored Usage: {debug_result['stored_usage']}")
        print(f"Actual Usage: {debug_result['actual_usage']}")
        print(f"Discrepancy: {debug_result['discrepancy']}")
        print(f"Status Counts: {debug_result['status_counts']}")
        
        # Fix the specific coupon
        print("\n" + "="*50)
        print("FIXING test3 COUPON:")
        await debugger.fix_coupon_usage("test3")
        
        # Debug again to confirm fix
        print("\n" + "="*50)
        print("VERIFICATION:")
        debug_result2 = await debugger.debug_coupon_usage("test3")
        print(f"After fix - Stored: {debug_result2['stored_usage']}, Actual: {debug_result2['actual_usage']}")
        
        # Fix all coupons
        print("\n" + "="*50)
        print("FIXING ALL COUPONS:")
        await debugger.fix_all_coupons()
        
    finally:
        await debugger.close()

if __name__ == "__main__":
    asyncio.run(main())
