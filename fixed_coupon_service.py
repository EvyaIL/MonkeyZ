# Comprehensive Coupon Service Fix
# This file contains the corrected coupon validation logic

from datetime import datetime, timezone
import logging
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class FixedCouponService:
    def __init__(self, db):
        self.db = db

    async def get_real_usage_count(self, coupon_code):
        """
        Calculate real-time usage count from orders collection.
        This is the source of truth for coupon usage.
        """
        try:
            orders_collection = self.db.orders
            
            # Build query for case-insensitive coupon code search
            query = {
                '$and': [
                    {
                        '$or': [
                            {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                            {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                        ]
                    },
                    {
                        'status': {'$nin': ['cancelled', 'failed']}
                    }
                ]
            }
            
            # Count orders with this coupon that are not cancelled
            count = await orders_collection.count_documents(query)
            
            logger.info(f"Real usage count for coupon '{coupon_code}': {count} orders found")
            return count
            
        except Exception as e:
            logger.error(f"Error calculating real usage count for coupon {coupon_code}: {e}")
            return 0

    async def get_user_usage_count(self, coupon_code, user_email):
        """
        Get usage count for a specific user and coupon.
        """
        try:
            orders_collection = self.db.orders
            
            # Normalize email for comparison
            user_email_lower = user_email.lower().strip()
            
            # Query for this user's usage of this coupon
            query = {
                '$and': [
                    {
                        '$or': [
                            {'userEmail': {'$regex': f'^{user_email_lower}$', '$options': 'i'}},
                            {'email': {'$regex': f'^{user_email_lower}$', '$options': 'i'}},
                            {'customerEmail': {'$regex': f'^{user_email_lower}$', '$options': 'i'}}
                        ]
                    },
                    {
                        '$or': [
                            {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                            {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                        ]
                    },
                    {
                        'status': {'$nin': ['cancelled', 'failed']}
                    }
                ]
            }
            
            count = await orders_collection.count_documents(query)
            logger.info(f"User {user_email} usage count for coupon '{coupon_code}': {count}")
            return count
            
        except Exception as e:
            logger.error(f"Error calculating user usage count for coupon {coupon_code}: {e}")
            return 0

    async def validate_coupon(self, coupon_code, original_total, user_email=None):
        """
        FIXED: Validates a coupon's eligibility but does NOT modify its usage count.
        Used for preview/validation only.
        
        Returns the discount amount, the coupon object, and any error message.
        """
        try:
            if not coupon_code:
                return 0.0, None, 'No coupon code provided.'
            
            # Use the admin database where coupons are actually stored
            admin_db = self.db.client.get_database("admin")
            collection = admin_db.get_collection("coupons")
            code = coupon_code.strip().lower()
            
            # Find the coupon (case-insensitive)
            coupon = await collection.find_one({'code': {'$regex': f'^{code}$', '$options': 'i'}, 'active': True})
            if not coupon:
                return 0.0, None, f'Coupon code \'{coupon_code}\' not found or not active.'

            # --- Expiration Check ---
            expires_at = coupon.get('expiresAt')
            if expires_at:
                if isinstance(expires_at, str):
                    try:
                        expires_at = datetime.fromisoformat(expires_at)
                    except Exception:
                        expires_at = None
                if expires_at:
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    if expires_at < datetime.now(timezone.utc):
                        return 0.0, None, 'Coupon expired.'

            # --- FIXED: Overall Usage Limit Check ---
            max_uses = coupon.get('maxUses')
            # CRITICAL FIX: Properly handle maxUses = 0 (unlimited)
            if max_uses is not None and max_uses > 0:
                current_usage = await self.get_real_usage_count(coupon['code'])
                logger.info(f"VALIDATE_COUPON: Max usage check for '{coupon['code']}': {current_usage}/{max_uses}")
                
                # STRICT CHECK: If current usage equals or exceeds max uses, block immediately
                if current_usage >= max_uses:
                    logger.warning(f"VALIDATE_COUPON: Overall usage limit exceeded for '{coupon_code}': {current_usage}/{max_uses}")
                    return 0.0, None, f'This coupon has reached its maximum usage limit ({current_usage}/{max_uses}). Please try a different coupon.'

            # --- FIXED: Per-User Usage Limit Check ---
            max_usage_per_user = coupon.get('maxUsagePerUser', 0)
            
            # CRITICAL FIX: Properly handle maxUsagePerUser = 0 (unlimited per user)
            if max_usage_per_user > 0:
                # If coupon has per-user limits, email is REQUIRED
                if not user_email:
                    logger.info(f"VALIDATE_COUPON: Coupon '{coupon['code']}' has per-user limit ({max_usage_per_user}) but no email provided")
                    return 0.0, None, 'This coupon requires an email address. Please enter your email first.'
                
                # Get user's current usage count
                user_usage_count = await self.get_user_usage_count(coupon['code'], user_email)
                logger.info(f"VALIDATE_COUPON: User {user_email} usage: {user_usage_count}/{max_usage_per_user}")
                
                if user_usage_count >= max_usage_per_user:
                    logger.warning(f"VALIDATE_COUPON: Per-user limit exceeded for {user_email}: {user_usage_count}/{max_usage_per_user}")
                    return 0.0, None, f'You have reached the usage limit for this coupon ({user_usage_count}/{max_usage_per_user}).'

            # --- Calculate Discount ---
            discount_type = coupon.get('discountType', 'percentage')
            discount_value = float(coupon.get('discountValue', 0))
            
            if discount_type == 'percentage':
                discount_amount = (original_total * discount_value) / 100
            else:  # fixed amount
                discount_amount = min(discount_value, original_total)  # Can't discount more than total
            
            # Round to 2 decimal places
            discount_amount = round(discount_amount, 2)
            
            logger.info(f"VALIDATE_COUPON: Valid coupon '{coupon_code}' - discount: {discount_amount}")
            return discount_amount, coupon, None
            
        except Exception as e:
            logger.error(f"Error validating coupon '{coupon_code}': {e}")
            return 0.0, None, f'Error validating coupon: {str(e)}'

    async def apply_coupon(self, coupon_code, original_total, user_email=None):
        """
        FIXED: Validates and applies a coupon, incrementing usage count.
        This should be called when payment is confirmed.
        
        Returns (discount_amount, coupon_object, error_message)
        """
        try:
            # First validate the coupon
            discount_amount, coupon, error = await self.validate_coupon(coupon_code, original_total, user_email)
            
            if error:
                return 0.0, None, error
            
            if discount_amount <= 0:
                return 0.0, None, 'Coupon provides no discount.'
            
            # --- FIXED: Update usage tracking ---
            admin_db = self.db.client.get_database("admin")
            collection = admin_db.get_collection("coupons")
            
            # Update overall usage count
            await self.update_coupon_usage_count(coupon['code'])
            
            # Update per-user usage tracking if applicable
            if user_email and coupon.get('maxUsagePerUser', 0) > 0:
                user_email_lower = user_email.lower().strip()
                
                # Update userUsages field
                await collection.update_one(
                    {'code': {'$regex': f'^{coupon["code"]}$', '$options': 'i'}},
                    {
                        '$inc': {f'userUsages.{user_email_lower}': 1}
                    }
                )
                
                logger.info(f"APPLY_COUPON: Updated per-user usage for {user_email}")
            
            logger.info(f"APPLY_COUPON: Successfully applied coupon '{coupon_code}': discount={discount_amount}")
            return discount_amount, coupon, None
            
        except Exception as e:
            logger.error(f"Error applying coupon '{coupon_code}': {e}")
            return 0.0, None, f'Error applying coupon: {str(e)}'

    async def update_coupon_usage_count(self, coupon_code):
        """
        FIXED: Update the stored usageCount field to match real orders count.
        """
        try:
            # Get real count from orders
            real_count = await self.get_real_usage_count(coupon_code)
            
            # Update the stored count in coupons collection
            admin_db = self.db.client.get_database("admin")
            collection = admin_db.get_collection("coupons")
            
            result = await collection.update_one(
                {'code': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                {'$set': {'usageCount': real_count}}
            )
            
            if result.modified_count > 0:
                logger.info(f"Updated usageCount for coupon '{coupon_code}' to {real_count}")
                return True
            else:
                logger.warning(f"No coupon found to update usage count for '{coupon_code}'")
                return False
                
        except Exception as e:
            logger.error(f"Error updating usage count for coupon {coupon_code}: {e}")
            return False

print("✅ Fixed Coupon Service created!")
print("Key fixes:")
print("1. Proper handling of maxUses = 0 (unlimited)")
print("2. Proper handling of maxUsagePerUser = 0 (unlimited per user)")
print("3. Fixed real-time usage counting")
print("4. Better error messages")
print("5. Improved user usage tracking")
print("6. Separated validation from application logic")
