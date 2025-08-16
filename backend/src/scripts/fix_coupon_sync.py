#!/usr/bin/env python3
"""
Comprehensive Coupon Synchronization Script
=========================================

This script fixes the coupon usage tracking issues between localhost and DigitalOcean.
It handles field name inconsistencies, database location differences, and usage count mismatches.

Run this script to sync all coupon data and ensure consistent behavior across environments.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
import logging

# Add the backend src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.mongodb.mongodb import MongoDb
from src.services.coupon_service import CouponService
from src.routers.admin_router import recalculate_coupon_analytics

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CouponSyncFixer:
    def __init__(self):
        self.mongo_db = MongoDb()
        self.db = None
        self.coupon_service = None
        
    async def initialize(self):
        """Initialize database connections"""
        try:
            await self.mongo_db.connection()
            self.db = await self.mongo_db.get_db()
            self.coupon_service = CouponService(self.db)
            logger.info("✅ Database connection established")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to database: {e}")
            return False
    
    async def analyze_database_structure(self):
        """Analyze the current database structure and field variations"""
        logger.info("🔍 Analyzing database structure...")
        
        try:
            # Check main database
            main_db_name = self.db.name
            logger.info(f"Main database: {main_db_name}")
            
            # Check admin database
            admin_db = self.db.client.get_database("admin")
            admin_collections = await admin_db.list_collection_names()
            logger.info(f"Admin database collections: {admin_collections}")
            
            # Check coupons in admin database
            if "coupons" in admin_collections:
                admin_coupon_count = await admin_db.coupons.count_documents({})
                logger.info(f"Coupons in admin.coupons: {admin_coupon_count}")
                
                # Sample a few coupons to see structure
                sample_coupons = await admin_db.coupons.find().limit(3).to_list(None)
                for i, coupon in enumerate(sample_coupons):
                    logger.info(f"Sample coupon {i+1}: {coupon.get('code')} - usageCount: {coupon.get('usageCount', 'missing')}")
            
            # Check orders structure
            sample_orders = await self.db.orders.find({'couponCode': {'$exists': True}}).limit(5).to_list(None)
            
            logger.info(f"Found {len(sample_orders)} orders with coupons")
            
            # Analyze field variations
            field_variations = {
                'coupon_code_fields': set(),
                'email_fields': set(),
                'status_values': set()
            }
            
            for order in sample_orders:
                # Check coupon code fields
                for field in ['couponCode', 'coupon_code']:
                    if field in order:
                        field_variations['coupon_code_fields'].add(field)
                
                # Check email fields
                for field in ['email', 'userEmail', 'customerEmail']:
                    if field in order:
                        field_variations['email_fields'].add(field)
                
                # Check status values
                if 'status' in order:
                    field_variations['status_values'].add(order['status'])
            
            logger.info(f"Field variations found: {dict(field_variations)}")
            
            return field_variations
            
        except Exception as e:
            logger.error(f"❌ Error analyzing database: {e}")
            return None
    
    async def fix_coupon_usage_counts(self):
        """Fix all coupon usage counts by recalculating from real orders"""
        logger.info("🔧 Fixing coupon usage counts...")
        
        try:
            # Get all active coupons from admin database
            admin_db = self.db.client.get_database("admin")
            coupons = await admin_db.coupons.find({'active': True}).to_list(None)
            
            logger.info(f"Found {len(coupons)} active coupons to fix")
            
            fixed_count = 0
            for coupon in coupons:
                coupon_code = coupon.get('code')
                if not coupon_code:
                    continue
                
                # Get stored usage count
                stored_usage = coupon.get('usageCount', 0)
                
                # Get real usage count from orders
                real_usage = await self.coupon_service.get_real_usage_count(coupon_code)
                
                # Check if fix is needed
                if stored_usage != real_usage:
                    # Update the stored count
                    await admin_db.coupons.update_one(
                        {'_id': coupon['_id']},
                        {'$set': {'usageCount': real_usage}}
                    )
                    
                    logger.info(f"✅ Fixed '{coupon_code}': {stored_usage} → {real_usage}")
                    fixed_count += 1
                else:
                    logger.info(f"✓ '{coupon_code}': already correct ({real_usage})")
            
            logger.info(f"🎉 Fixed {fixed_count} coupon usage counts")
            return fixed_count
            
        except Exception as e:
            logger.error(f"❌ Error fixing usage counts: {e}")
            return 0
    
    async def standardize_order_fields(self):
        """Standardize order field names for consistency"""
        logger.info("🔧 Standardizing order field names...")
        
        try:
            # Find orders with coupon codes that need field standardization
            orders_to_update = []
            
            # Check for orders with couponCode but missing coupon_code
            cursor = self.db.orders.find({
                'couponCode': {'$exists': True},
                'coupon_code': {'$exists': False}
            })
            
            async for order in cursor:
                orders_to_update.append({
                    '_id': order['_id'],
                    'coupon_code': order['couponCode']
                })
            
            # Update orders to have both field names
            update_count = 0
            for order_update in orders_to_update:
                await self.db.orders.update_one(
                    {'_id': order_update['_id']},
                    {'$set': {'coupon_code': order_update['coupon_code']}}
                )
                update_count += 1
            
            if update_count > 0:
                logger.info(f"✅ Standardized {update_count} order field names")
            else:
                logger.info("✓ All order fields already standardized")
            
            return update_count
            
        except Exception as e:
            logger.error(f"❌ Error standardizing fields: {e}")
            return 0
    
    async def recalculate_all_analytics(self):
        """Recalculate analytics for all coupons"""
        logger.info("📊 Recalculating all coupon analytics...")
        
        try:
            # Get all coupons
            admin_db = self.db.client.get_database("admin")
            coupons = await admin_db.coupons.find({'active': True}).to_list(None)
            
            recalc_count = 0
            for coupon in coupons:
                coupon_code = coupon.get('code')
                if coupon_code:
                    await recalculate_coupon_analytics(coupon_code, self.db)
                    recalc_count += 1
                    logger.info(f"✅ Recalculated analytics for '{coupon_code}'")
            
            logger.info(f"🎉 Recalculated analytics for {recalc_count} coupons")
            return recalc_count
            
        except Exception as e:
            logger.error(f"❌ Error recalculating analytics: {e}")
            return 0
    
    async def validate_fixes(self):
        """Validate that the fixes worked correctly"""
        logger.info("✅ Validating fixes...")
        
        try:
            admin_db = self.db.client.get_database("admin")
            coupons = await admin_db.coupons.find({'active': True}).to_list(None)
            
            all_correct = True
            for coupon in coupons:
                coupon_code = coupon.get('code')
                if not coupon_code:
                    continue
                
                stored_usage = coupon.get('usageCount', 0)
                real_usage = await self.coupon_service.get_real_usage_count(coupon_code)
                
                if stored_usage != real_usage:
                    logger.error(f"❌ '{coupon_code}' still incorrect: stored={stored_usage}, real={real_usage}")
                    all_correct = False
                else:
                    logger.info(f"✓ '{coupon_code}': correct ({real_usage})")
            
            if all_correct:
                logger.info("🎉 All coupon usage counts are now correct!")
            else:
                logger.warning("⚠️ Some coupons still have incorrect usage counts")
            
            return all_correct
            
        except Exception as e:
            logger.error(f"❌ Error validating fixes: {e}")
            return False
    
    async def run_complete_fix(self):
        """Run the complete coupon synchronization fix"""
        logger.info("🚀 Starting comprehensive coupon synchronization fix...")
        
        if not await self.initialize():
            return False
        
        try:
            # Step 1: Analyze current state
            field_analysis = await self.analyze_database_structure()
            if not field_analysis:
                return False
            
            # Step 2: Standardize order fields
            await self.standardize_order_fields()
            
            # Step 3: Fix usage counts
            fixed_count = await self.fix_coupon_usage_counts()
            
            # Step 4: Recalculate analytics
            await self.recalculate_all_analytics()
            
            # Step 5: Validate fixes
            validation_success = await self.validate_fixes()
            
            if validation_success:
                logger.info("🎉 Coupon synchronization completed successfully!")
                logger.info("✅ DigitalOcean should now behave exactly like localhost")
            else:
                logger.warning("⚠️ Some issues remain - manual intervention may be needed")
            
            return validation_success
            
        except Exception as e:
            logger.error(f"❌ Error in complete fix: {e}")
            return False
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Cleanup database connections"""
        try:
            if self.mongo_db:
                # Close database connections if needed
                pass
            logger.info("🧹 Cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

async def main():
    """Main execution function"""
    logger.info("=" * 60)
    logger.info("COUPON SYNCHRONIZATION FIX")
    logger.info("=" * 60)
    
    fixer = CouponSyncFixer()
    success = await fixer.run_complete_fix()
    
    if success:
        logger.info("\n🎉 SUCCESS: Coupon synchronization completed!")
        logger.info("The coupons should now work identically on localhost and DigitalOcean.")
        return 0
    else:
        logger.error("\n❌ FAILED: Coupon synchronization encountered errors.")
        logger.error("Please check the logs above for details.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
