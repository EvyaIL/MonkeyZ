"""
Coupon Analytics Synchronization Service
Fixes the disconnect between order counts and usage display
"""

from datetime import datetime, timezone
import logging
from typing import Dict, Any, Optional
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class CouponAnalyticsService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
    async def _get_coupons_collection(self):
        """Helper method to get the coupons collection from admin database."""
        try:
            # Check if we're already connected to admin database
            if hasattr(self.db, 'name') and self.db.name == "admin":
                return self.db.coupons
            
            # Otherwise, access admin database through client
            if hasattr(self.db, 'client'):
                admin_db = self.db.client.get_database("admin")
                return admin_db.coupons
            
            # Fallback - assume we're in the right database
            return self.db.coupons
            
        except Exception as e:
            logger.error(f"Error accessing coupons collection: {e}")
            # Fallback to current database
            return self.db.coupons
        
    async def sync_all_coupon_analytics(self) -> Dict[str, Any]:
        """
        Synchronize all coupon analytics to match real order data.
        This fixes the "Total: 1 but Used: 0" issue.
        """
        try:
            logger.info("=== STARTING COUPON ANALYTICS SYNC ===")
            
            # Get all active coupons using helper method
            coupons_collection = await self._get_coupons_collection()
            
            coupons = await coupons_collection.find({'active': True}).to_list(None)
            logger.info(f"Found {len(coupons)} active coupons to sync")
            
            sync_results = {}
            
            for coupon in coupons:
                coupon_code = coupon.get('code')
                if not coupon_code:
                    continue
                    
                logger.info(f"Syncing analytics for coupon: {coupon_code}")
                
                # Get real usage count from orders
                real_usage = await self._get_real_usage_count(coupon_code)
                stored_usage = coupon.get('usageCount', 0)
                
                logger.info(f"Coupon {coupon_code}: stored={stored_usage}, real={real_usage}")
                
                # Update the stored count to match reality
                if real_usage != stored_usage:
                    await coupons_collection.update_one(
                        {'_id': coupon['_id']},
                        {'$set': {'usageCount': real_usage}}
                    )
                    logger.info(f"Updated {coupon_code}: {stored_usage} -> {real_usage}")
                    
                # Get detailed analytics
                analytics = await self._get_coupon_analytics(coupon_code)
                
                sync_results[coupon_code] = {
                    'old_usage_count': stored_usage,
                    'new_usage_count': real_usage,
                    'updated': real_usage != stored_usage,
                    'analytics': analytics
                }
            
            logger.info("=== COUPON ANALYTICS SYNC COMPLETED ===")
            return {
                'success': True,
                'synced_coupons': len(sync_results),
                'results': sync_results
            }
            
        except Exception as e:
            logger.error(f"Error syncing coupon analytics: {e}")
            return {
                'success': False,
                'error': str(e),
                'results': {}
            }
    
    async def _get_real_usage_count(self, coupon_code: str) -> int:
        """Get the real usage count from orders collection."""
        try:
            orders_collection = self.db.orders
            
            # Count orders with this coupon that are not cancelled
            count = await orders_collection.count_documents({
                'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            return count
            
        except Exception as e:
            logger.error(f"Error getting real usage count for {coupon_code}: {e}")
            return 0
    
    async def _get_coupon_analytics(self, coupon_code: str) -> Dict[str, Any]:
        """Get detailed analytics for a coupon."""
        try:
            orders_collection = self.db.orders
            
            # Get all orders with this coupon
            orders = await orders_collection.find({
                'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}
            }).to_list(None)
            
            analytics = {
                'total_orders': len(orders),
                'completed': 0,
                'pending': 0,
                'processing': 0,
                'awaiting_stock': 0,
                'cancelled': 0,
                'failed': 0
            }
            
            for order in orders:
                status = order.get('status', '').lower()
                if status == 'completed':
                    analytics['completed'] += 1
                elif status == 'pending':
                    analytics['pending'] += 1
                elif status == 'processing':
                    analytics['processing'] += 1
                elif status == 'awaiting_stock':
                    analytics['awaiting_stock'] += 1
                elif status == 'cancelled':
                    analytics['cancelled'] += 1
                elif status == 'failed':
                    analytics['failed'] += 1
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting analytics for {coupon_code}: {e}")
            return {}
