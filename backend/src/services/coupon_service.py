from datetime import datetime, timezone
import logging
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from .coupon_validation_tracker import CouponValidationTracker

logger = logging.getLogger(__name__)

class CouponService:
    def __init__(self, db):
        self.db = db

    async def get_real_usage_count(self, coupon_code):
        """
        Calculate real-time usage count from orders collection.
        This is the source of truth for coupon usage.
        """
        try:
            orders_collection = self.db.orders
            
            # Count orders with this coupon that are not cancelled
            # Use case-insensitive search for coupon codes and check both field variations
            count = await orders_collection.count_documents({
                '$or': [
                    {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                    {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                ],
                'status': {'$nin': ['cancelled', 'failed']}
            })
            
            logger.info(f"Real usage count for coupon '{coupon_code}': {count}")
            return count
            
        except Exception as e:
            logger.error(f"Error calculating real usage count for coupon {coupon_code}: {e}")
            return 0

    async def update_coupon_usage_count(self, coupon_code):
        """
        Update the stored usageCount field to match real orders count.
        This syncs the display with actual usage.
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

    async def apply_coupon(self, coupon_code, original_total, user_email=None):
        """
        Validates and applies a coupon, incrementing usage count.
        This should be called when payment is confirmed.
        
        Returns (discount_amount, coupon_object, error_message)
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

            # --- Overall Usage Limit Check ---
            # Use real-time usage count instead of stored usageCount
            max_uses = coupon.get('maxUses')
            if max_uses is not None:
                current_usage = await self.get_real_usage_count(coupon['code'])
                if current_usage >= max_uses:
                    logger.warning(f"Coupon '{coupon_code}' usage limit exceeded: {current_usage}/{max_uses}")
                    return 0.0, None, f'Coupon usage limit exceeded ({current_usage}/{max_uses}).'

            # --- Per-User Usage Limit Check ---
            if user_email:
                max_usage_per_user = coupon.get('maxUsagePerUser', 0)
                if max_usage_per_user > 0:
                    # ENHANCED: Use the same robust checking as validate_coupon
                    user_email_lower = user_email.lower().strip()
                    
                    # Method 1: Check userUsages field
                    user_usages = coupon.get('userUsages', {})
                    usage_from_coupon = 0
                    
                    for email_key in [user_email, user_email_lower]:
                        if email_key in user_usages:
                            usage_from_coupon = user_usages[email_key]
                            break
                    
                    # Method 2: Query orders collection
                    orders_collection = self.db.orders
                    query = {
                        '$and': [
                            {
                                '$or': [
                                    {'userEmail': {'$regex': f'^{user_email}$', '$options': 'i'}},
                                    {'email': {'$regex': f'^{user_email}$', '$options': 'i'}},
                                    {'customerEmail': {'$regex': f'^{user_email}$', '$options': 'i'}}
                                ]
                            },
                            {
                                '$or': [
                                    {'couponCode': {'$regex': f'^{coupon["code"]}$', '$options': 'i'}},
                                    {'coupon_code': {'$regex': f'^{coupon["code"]}$', '$options': 'i'}}
                                ]
                            },
                            {
                                'status': {'$nin': ['cancelled', 'failed']}
                            }
                        ]
                    }
                    
                    usage_from_orders = await orders_collection.count_documents(query)
                    
                    # Use maximum for safety
                    actual_usage_count = max(usage_from_coupon, usage_from_orders)
                    logger.info(f"APPLY_COUPON: User {user_email} usage check - coupon field: {usage_from_coupon}, orders: {usage_from_orders}, final: {actual_usage_count}")
                    
                    if actual_usage_count >= max_usage_per_user:
                        return 0.0, None, f'You have reached the usage limit for this coupon ({actual_usage_count}/{max_usage_per_user}).'

            # --- Calculate Discount ---
            discount_type = coupon.get('discountType', 'percentage')
            discount_value = float(coupon.get('discountValue', 0))
            
            if discount_type == 'percentage':
                discount_amount = (original_total * discount_value) / 100
            else:  # fixed amount
                discount_amount = min(discount_value, original_total)  # Can't discount more than total
            
            # Round to 2 decimal places
            discount_amount = round(discount_amount, 2)
            
            # --- UPDATE USAGE COUNT TO MATCH REALITY ---
            # Instead of just incrementing, update to real count
            await self.update_coupon_usage_count(coupon['code'])
            
            logger.info(f"Successfully applied coupon '{coupon_code}': ${discount_amount} discount")
            return discount_amount, coupon, None
            
        except Exception as e:
            logger.error(f"Error applying coupon '{coupon_code}': {e}")
            return 0.0, None, f'Error applying coupon: {str(e)}'

    async def validate_coupon(self, coupon_code, original_total, user_email=None):
        """
        Validates a coupon's eligibility but does NOT modify its usage count.
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
            
            coupon = await collection.find_one({'code': code, 'active': True})
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

            # --- Overall Usage Limit Check ---
            # Use real-time usage count instead of stored usageCount
            max_uses = coupon.get('maxUses')
            if max_uses is not None:
                current_usage = await self.get_real_usage_count(coupon['code'])
                if current_usage >= max_uses:
                    return 0.0, None, f'Coupon usage limit reached ({current_usage}/{max_uses}).'

            # --- Per-User Usage Limit Check ---
            if user_email:
                max_usage_per_user = coupon.get('maxUsagePerUser', 0)
                logger.info(f"VALIDATE_COUPON: Checking per-user limit for {user_email}: maxUsagePerUser={max_usage_per_user}")
                
                if max_usage_per_user > 0:
                    # ENHANCED: Always check both userUsages field AND orders collection for maximum accuracy
                    user_email_lower = user_email.lower().strip()  # Normalize email for comparison
                    
                    # Method 1: Check userUsages field (more reliable if properly maintained)
                    user_usages = coupon.get('userUsages', {})
                    usage_from_coupon = 0
                    
                    # Check for the email in userUsages (try both original and normalized)
                    for email_key in [user_email, user_email_lower]:
                        if email_key in user_usages:
                            usage_from_coupon = user_usages[email_key]
                            break
                    
                    logger.info(f"VALIDATE_COUPON: From coupon.userUsages: {user_email} has used {usage_from_coupon} times")
                    
                    # Method 2: Always query orders collection as backup/verification
                    orders_collection = self.db.orders
                    
                    # Enhanced query with more variations and case-insensitive matching
                    query = {
                        '$and': [
                            {
                                '$or': [
                                    {'userEmail': {'$regex': f'^{user_email}$', '$options': 'i'}},
                                    {'email': {'$regex': f'^{user_email}$', '$options': 'i'}},
                                    {'customerEmail': {'$regex': f'^{user_email}$', '$options': 'i'}}
                                ]
                            },
                            {
                                '$or': [
                                    {'couponCode': {'$regex': f'^{coupon["code"]}$', '$options': 'i'}},
                                    {'coupon_code': {'$regex': f'^{coupon["code"]}$', '$options': 'i'}}
                                ]
                            },
                            {
                                'status': {'$nin': ['cancelled', 'failed']}
                            }
                        ]
                    }
                    
                    usage_from_orders = await orders_collection.count_documents(query)
                    logger.info(f"VALIDATE_COUPON: From orders query: {user_email} has used {usage_from_orders} times")
                    
                    # Use the MAXIMUM of both methods for safety (prevents bypass)
                    actual_usage_count = max(usage_from_coupon, usage_from_orders)
                    logger.info(f"VALIDATE_COUPON: Final usage count (max of both methods): {actual_usage_count}")
                    
                    if actual_usage_count >= max_usage_per_user:
                        logger.warning(f"VALIDATE_COUPON: Per-user limit exceeded for {user_email}: {actual_usage_count}/{max_usage_per_user}")
                        return 0.0, None, f'You have reached the usage limit for this coupon ({actual_usage_count}/{max_usage_per_user}).'

            # --- Calculate Discount ---
            discount_type = coupon.get('discountType', 'percentage')
            discount_value = float(coupon.get('discountValue', 0))
            
            if discount_type == 'percentage':
                discount_amount = (original_total * discount_value) / 100
            else:  # fixed amount
                discount_amount = min(discount_value, original_total)  # Can't discount more than total
            
            # Round to 2 decimal places
            discount_amount = round(discount_amount, 2)
            
            return discount_amount, coupon, None
            
        except Exception as e:
            logger.error(f"Error validating coupon '{coupon_code}': {e}")
            return 0.0, None, f'Error validating coupon: {str(e)}'
            
        except Exception as e:
            return 0.0, None, f'Error validating coupon: {str(e)}' 

    async def validate_and_apply_coupon(self, coupon_code, total, user_email=None):
        """
        DEPRECATED: Use apply_coupon() instead for real usage, validate_coupon() for preview.
        """
        return await self.validate_coupon(coupon_code, total, user_email)
