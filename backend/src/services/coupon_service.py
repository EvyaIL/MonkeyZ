from datetime import datetime, timezone
import logging
import re
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorDatabase
from .coupon_validation_tracker import CouponValidationTracker

logger = logging.getLogger(__name__)

class CouponService:
    def __init__(self, db):
        self.db = db
        # Try to determine if this is admin or main database
        self.is_admin_db = hasattr(db, 'name') and db.name == 'admin'
        
    async def _get_coupons_collection(self):
        """Get the coupons collection from admin database"""
        try:
            if self.is_admin_db:
                logger.info("Using admin database directly for coupons")
                return self.db.coupons
            else:
                # If we have main db, try to access admin db through client
                if hasattr(self.db, 'client'):
                    logger.info("Accessing admin database through client for coupons")
                    admin_db = self.db.client.get_database("admin")
                    return admin_db.coupons
                else:
                    logger.warning("No client available, using current database for coupons")
                    # Fallback to current db
                    return self.db.coupons
        except Exception as e:
            logger.error(f"Error accessing coupons collection: {e}")
            logger.warning("Falling back to current database for coupons")
            return self.db.coupons

    async def get_real_usage_count(self, coupon_code):
        """
        Calculate real-time usage count from orders collection.
        This is the source of truth for coupon usage.
        """
        try:
            # Use the orders collection from the current database
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
        Enhanced with better email matching and debug logging.
        """
        try:
            # Use the orders collection from the current database
            orders_collection = self.db.orders
            
            # Normalize inputs for comparison
            user_email_normalized = user_email.lower().strip()
            coupon_code_normalized = coupon_code.lower().strip()
            
            logger.info(f"Getting user usage: email='{user_email}' (normalized: '{user_email_normalized}'), coupon='{coupon_code}'")
            
            # Build comprehensive query to catch all variations
            email_conditions = [
                # Case-insensitive regex matches
                {'userEmail': {'$regex': f'^{re.escape(user_email)}$', '$options': 'i'}},
                {'email': {'$regex': f'^{re.escape(user_email)}$', '$options': 'i'}},
                {'customerEmail': {'$regex': f'^{re.escape(user_email)}$', '$options': 'i'}},
                # Exact normalized matches
                {'userEmail': user_email_normalized},
                {'email': user_email_normalized},
                {'customerEmail': user_email_normalized},
                # Original case matches
                {'userEmail': user_email},
                {'email': user_email},
                {'customerEmail': user_email}
            ]
            
            coupon_conditions = [
                {'couponCode': {'$regex': f'^{re.escape(coupon_code)}$', '$options': 'i'}},
                {'coupon_code': {'$regex': f'^{re.escape(coupon_code)}$', '$options': 'i'}},
                {'couponCode': coupon_code_normalized},
                {'coupon_code': coupon_code_normalized},
                {'couponCode': coupon_code},
                {'coupon_code': coupon_code}
            ]
            
            # Enhanced query with comprehensive email and coupon matching
            query = {
                '$and': [
                    {'$or': email_conditions},
                    {'$or': coupon_conditions},
                    {'status': {'$nin': ['cancelled', 'failed']}}
                ]
            }
            
            count = await orders_collection.count_documents(query)
            
            # DEBUG: Get actual orders for debugging
            debug_orders = await orders_collection.find(query).to_list(None)
            logger.info(f"DEBUG: User {user_email} usage count for coupon '{coupon_code}': {count}")
            logger.info(f"DEBUG: Found {len(debug_orders)} matching orders")
            for order in debug_orders:
                logger.info(f"DEBUG: Order {order.get('_id')} - email: {order.get('email', order.get('userEmail', order.get('customerEmail')))}, coupon: {order.get('couponCode', order.get('coupon_code'))}, status: {order.get('status')}")
            
            return count
            
        except Exception as e:
            logger.error(f"Error calculating user usage count for coupon {coupon_code}: {e}")
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
            
            # Get the coupons collection
            collection = await self._get_coupons_collection()
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
                logger.info(f"APPLY_COUPON: Max usage check for '{coupon['code']}': {current_usage}/{max_uses}")
                
                # STRICT CHECK: If current usage equals or exceeds max uses, block immediately
                if current_usage >= max_uses:
                    logger.warning(f"APPLY_COUPON: Overall usage limit exceeded for '{coupon_code}': {current_usage}/{max_uses}")
                    return 0.0, None, f'This coupon has reached its maximum usage limit ({current_usage}/{max_uses}). Please try a different coupon.'

            # --- FIXED: Per-User Usage Limit Check ---
            max_usage_per_user = coupon.get('maxUsagePerUser', 0)
            
            # CRITICAL FIX: Properly handle maxUsagePerUser = 0 (unlimited per user)
            if max_usage_per_user > 0:
                # If coupon has per-user limits, email is REQUIRED for apply_coupon
                if not user_email:
                    logger.info(f"APPLY_COUPON: Coupon '{coupon['code']}' has per-user limit ({max_usage_per_user}) but no email provided")
                    return 0.0, None, 'This coupon requires an email address for usage tracking.'
                
                # Get user's current usage count using the improved method
                user_usage_count = await self.get_user_usage_count(coupon['code'], user_email)
                logger.info(f"APPLY_COUPON: User {user_email} usage: {user_usage_count}/{max_usage_per_user}")
                
                if user_usage_count >= max_usage_per_user:
                    logger.warning(f"APPLY_COUPON: Per-user limit exceeded for {user_email}: {user_usage_count}/{max_usage_per_user}")
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
            logger.info(f"=== VALIDATE_COUPON START ===")
            logger.info(f"Input: code='{coupon_code}', total={original_total}, email='{user_email}'")
            
            if not coupon_code:
                return 0.0, None, 'No coupon code provided.'
            
            # Get the coupons collection
            collection = await self._get_coupons_collection()
            code = coupon_code.strip().lower()
            
            logger.info(f"Searching for coupon with code: '{code}' (case-insensitive)")
            
            # Find the coupon (case-insensitive)
            coupon = await collection.find_one({'code': {'$regex': f'^{code}$', '$options': 'i'}, 'active': True})
            if not coupon:
                logger.warning(f"Coupon not found: '{coupon_code}'")
                return 0.0, None, f'Coupon code \'{coupon_code}\' not found or not active.'

            logger.info(f"Found coupon: {coupon.get('code')} (ID: {coupon.get('_id')})")
            logger.info(f"Coupon details: maxUses={coupon.get('maxUses')}, maxUsagePerUser={coupon.get('maxUsagePerUser')}")

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
            logger.info(f"Per-user limit check: maxUsagePerUser={max_usage_per_user}")
            
            # CRITICAL FIX: Properly handle maxUsagePerUser = 0 (unlimited per user)
            if max_usage_per_user > 0:
                logger.info(f"Coupon has per-user limit of {max_usage_per_user}")
                # If coupon has per-user limits, email is REQUIRED
                if not user_email:
                    logger.warning(f"VALIDATE_COUPON: Coupon '{coupon['code']}' has per-user limit ({max_usage_per_user}) but no email provided")
                    return 0.0, None, 'This coupon requires an email address. Please enter your email first.'
                
                logger.info(f"Checking per-user usage for email: '{user_email}'")
                # Get user's current usage count using the improved method
                user_usage_count = await self.get_user_usage_count(coupon['code'], user_email)
                logger.info(f"VALIDATE_COUPON: User {user_email} usage: {user_usage_count}/{max_usage_per_user}")
                
                if user_usage_count >= max_usage_per_user:
                    logger.warning(f"VALIDATE_COUPON: Per-user limit exceeded for {user_email}: {user_usage_count}/{max_usage_per_user}")
                    return 0.0, None, f'You have reached the usage limit for this coupon ({user_usage_count}/{max_usage_per_user}).'
                else:
                    logger.info(f"Per-user limit check PASSED: {user_usage_count}/{max_usage_per_user}")
            else:
                logger.info("No per-user limit set (unlimited per user)")

            # --- Calculate Discount ---
            discount_type = coupon.get('discountType', 'percentage')
            discount_value = float(coupon.get('discountValue', 0))
            
            logger.info(f"Calculating discount: type={discount_type}, value={discount_value}, total={original_total}")
            
            if discount_type == 'percentage':
                discount_amount = (original_total * discount_value) / 100
            else:  # fixed amount
                discount_amount = min(discount_value, original_total)  # Can't discount more than total
            
            # Round to 2 decimal places
            discount_amount = round(discount_amount, 2)
            
            logger.info(f"=== VALIDATE_COUPON SUCCESS ===")
            logger.info(f"Returning: discount={discount_amount}, coupon_code='{coupon.get('code')}', error=None")
            
            return discount_amount, coupon, None
            
        except Exception as e:
            logger.error(f"Error validating coupon '{coupon_code}': {e}")
            return 0.0, None, f'Error validating coupon: {str(e)}' 

    async def validate_and_apply_coupon(self, coupon_code, total, user_email=None):
        """
        DEPRECATED: Use apply_coupon() instead for real usage, validate_coupon() for preview.
        """
        return await self.validate_coupon(coupon_code, total, user_email)
