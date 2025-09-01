"""
Enhanced coupon service that tracks validation attempts for per-user limits.
"""
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

class CouponValidationTracker:
    """Tracks coupon validation attempts to enforce per-user limits"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.validation_attempts = db.get_collection("coupon_validation_attempts")
    
    async def track_validation_attempt(self, coupon_code: str, user_email: str):
        """Record a validation attempt for a user and coupon"""
        try:
            await self.validation_attempts.insert_one({
                'couponCode': coupon_code,
                'userEmail': user_email,
                'timestamp': datetime.now(timezone.utc),
                'type': 'validation'
            })
            logger.info(f"Tracked validation attempt: {coupon_code} by {user_email}")
        except Exception as e:
            logger.error(f"Failed to track validation attempt: {e}")
    
    async def count_user_validation_attempts(self, coupon_code: str, user_email: str) -> int:
        """Count how many times a user has validated a specific coupon"""
        try:
            count = await self.validation_attempts.count_documents({
                'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
                'userEmail': user_email
            })
            logger.info(f"User {user_email} has validated coupon {coupon_code} {count} times")
            return count
        except Exception as e:
            logger.error(f"Failed to count validation attempts: {e}")
            return 0
    
    async def count_user_successful_orders(self, coupon_code: str, user_email: str) -> int:
        """Count how many times a user has successfully used a coupon"""
        try:
            orders_collection = self.db.orders
            count = await orders_collection.count_documents({
                '$or': [
                    {'userEmail': user_email},
                    {'email': user_email},
                    {'customerEmail': user_email}
                ],
                'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
                'status': {'$nin': ['cancelled', 'failed']}
            })
            logger.info(f"User {user_email} has successfully used coupon {coupon_code} {count} times")
            return count
        except Exception as e:
            logger.error(f"Failed to count successful orders: {e}")
            return 0
