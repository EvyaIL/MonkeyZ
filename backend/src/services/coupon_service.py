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
        ULTRA-RELIABLE VERSION - Uses multiple strategies to ensure accuracy.
        """
        try:
            orders_collection = self.db.orders
            
            logger.info(f"🔍 ULTRA-RELIABLE USER COUNT: email='{user_email}', coupon='{coupon_code}'")
            
            # Strategy 1: Direct exact match (normalized)
            user_email_lower = user_email.lower().strip()
            coupon_code_lower = coupon_code.lower().strip()
            
            exact_match_queries = [
                # Exact email matches with different coupon field names
                {
                    'email': user_email_lower,
                    'couponCode': coupon_code_lower,
                    'status': {'$nin': ['cancelled', 'failed']}
                },
                {
                    'email': user_email_lower,
                    'coupon_code': coupon_code_lower,
                    'status': {'$nin': ['cancelled', 'failed']}
                },
                # Try with userEmail field
                {
                    'userEmail': user_email_lower,
                    'couponCode': coupon_code_lower,
                    'status': {'$nin': ['cancelled', 'failed']}
                },
                {
                    'userEmail': user_email_lower,
                    'coupon_code': coupon_code_lower,
                    'status': {'$nin': ['cancelled', 'failed']}
                },
                # Try with customerEmail field
                {
                    'customerEmail': user_email_lower,
                    'couponCode': coupon_code_lower,
                    'status': {'$nin': ['cancelled', 'failed']}
                },
                {
                    'customerEmail': user_email_lower,
                    'coupon_code': coupon_code_lower,
                    'status': {'$nin': ['cancelled', 'failed']}
                }
            ]
            
            exact_count = 0
            found_orders = []
            
            for i, query in enumerate(exact_match_queries):
                orders = await orders_collection.find(query).to_list(None)
                if orders:
                    logger.info(f"   📋 Exact query {i+1} found {len(orders)} orders")
                    for order in orders:
                        if str(order.get('_id')) not in [str(o.get('_id')) for o in found_orders]:
                            found_orders.append(order)
                            exact_count += 1
            
            # Strategy 2: Case-insensitive regex match (backup)
            if exact_count == 0:
                logger.info(f"   🔄 No exact matches, trying case-insensitive regex...")
                
                regex_queries = [
                    {
                        'email': {'$regex': f'^{re.escape(user_email)}$', '$options': 'i'},
                        'couponCode': {'$regex': f'^{re.escape(coupon_code)}$', '$options': 'i'},
                        'status': {'$nin': ['cancelled', 'failed']}
                    },
                    {
                        'email': {'$regex': f'^{re.escape(user_email)}$', '$options': 'i'},
                        'coupon_code': {'$regex': f'^{re.escape(coupon_code)}$', '$options': 'i'},
                        'status': {'$nin': ['cancelled', 'failed']}
                    }
                ]
                
                for i, query in enumerate(regex_queries):
                    orders = await orders_collection.find(query).to_list(None)
                    if orders:
                        logger.info(f"   � Regex query {i+1} found {len(orders)} orders")
                        for order in orders:
                            if str(order.get('_id')) not in [str(o.get('_id')) for o in found_orders]:
                                found_orders.append(order)
            
            final_count = len(found_orders)
            logger.info(f"✅ TOTAL UNIQUE ORDERS FOUND: {final_count}")
            
            # Log each found order for debugging
            for order in found_orders:
                order_id = order.get('_id')
                email_field = order.get('email') or order.get('userEmail') or order.get('customerEmail') or 'NONE'
                coupon_field = order.get('couponCode') or order.get('coupon_code') or 'NONE'
                status = order.get('status')
                logger.info(f"   📋 Found: Order {order_id} | Email: {email_field} | Coupon: {coupon_field} | Status: {status}")
            
            # CRITICAL: If we found any orders, the user has used this coupon
            if final_count > 0:
                logger.warning(f"🚨 USER HAS USED COUPON: {user_email} used '{coupon_code}' {final_count} time(s)")
            else:
                logger.info(f"✅ USER CLEAN: {user_email} has NOT used '{coupon_code}'")
            
            return final_count
            
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
        
        CRITICAL: This method MUST block users who have exceeded limits.
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

            logger.info(f"🔍 Found coupon: {coupon.get('code')} (ID: {coupon.get('_id')})")
            logger.info(f"🔍 RAW Coupon data: {coupon}")
            logger.info(f"🔍 Coupon fields: active={coupon.get('active')}, maxUses={coupon.get('maxUses')}, maxUsagePerUser={coupon.get('maxUsagePerUser')}")
            logger.info(f"🔍 Discount: type={coupon.get('discountType')}, value={coupon.get('discountValue')}")

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

            # --- CRITICAL: Per-User Usage Limit Check FIRST (most important) ---
            max_usage_per_user = coupon.get('maxUsagePerUser', 0)
            logger.info(f"🔍 Per-user limit check: maxUsagePerUser={max_usage_per_user} (type: {type(max_usage_per_user)})")
            
            # CRITICAL FIX: Handle all possible data types and None/null values
            effective_max_per_user = 0
            if max_usage_per_user is not None:
                try:
                    if isinstance(max_usage_per_user, (int, float)):
                        effective_max_per_user = int(max_usage_per_user)
                    elif isinstance(max_usage_per_user, str):
                        effective_max_per_user = int(float(max_usage_per_user.strip())) if max_usage_per_user.strip() else 0
                    else:
                        effective_max_per_user = 0
                except (ValueError, TypeError):
                    effective_max_per_user = 0
            
            logger.info(f"🔍 EFFECTIVE per-user limit: {effective_max_per_user}")
            
            # MANDATORY CHECK: If there's a per-user limit, enforce it strictly
            if effective_max_per_user > 0:
                logger.info(f"� ENFORCING per-user limit of {effective_max_per_user}")
                
                # Email is REQUIRED for per-user limits
                if not user_email or not user_email.strip():
                    error_msg = 'This coupon requires an email address. Please enter your email first.'
                    logger.warning(f"� BLOCKED: No email provided for per-user coupon")
                    return 0.0, None, error_msg
                
                # PRIORITY CHECK: Use userUsages data from coupon if available (most reliable)
                user_usages = coupon.get('userUsages', {})
                user_usage_count = 0
                
                if user_usages:
                    # Check for email in userUsages (case-insensitive)
                    for email_key, usage_count in user_usages.items():
                        if email_key.lower() == user_email.lower():
                            user_usage_count = usage_count
                            logger.warning(f"🚨 COUPON userUsages CHECK: {user_email} has used '{coupon['code']}' {user_usage_count} times")
                            break
                
                # If no userUsages data, fallback to database query
                if user_usage_count == 0:
                    # Get user's current usage count from orders database
                    user_usage_count = await self.get_user_usage_count(coupon['code'], user_email)
                    logger.info(f"🔍 DATABASE QUERY: User {user_email} usage: {user_usage_count}")
                
                logger.info(f"🎯 CRITICAL CHECK: User {user_email} usage: {user_usage_count}/{effective_max_per_user}")
                
                # CRITICAL: Block if user has reached or exceeded limit
                if user_usage_count >= effective_max_per_user:
                    error_msg = f'You have reached the usage limit for this coupon ({user_usage_count}/{effective_max_per_user}).'
                    logger.warning(f"🚨 BLOCKED: Per-user limit exceeded for {user_email}: {user_usage_count}/{effective_max_per_user}")
                    logger.warning(f"🚨 RETURNING ERROR: {error_msg}")
                    # FORCE RETURN - Do not continue to discount calculation
                    return 0.0, None, error_msg
                else:
                    logger.info(f"✅ PASSED: Per-user limit check: {user_usage_count}/{effective_max_per_user}")
            else:
                logger.info("ℹ️ No per-user limit set (unlimited per user) or limit is 0")

            # --- Overall Usage Limit Check ---
            max_uses = coupon.get('maxUses')
            # CRITICAL FIX: Properly handle maxUses = 0 (unlimited)
            if max_uses is not None and max_uses > 0:
                current_usage = await self.get_real_usage_count(coupon['code'])
                logger.info(f"VALIDATE_COUPON: Max usage check for '{coupon['code']}': {current_usage}/{max_uses}")
                
                # STRICT CHECK: If current usage equals or exceeds max uses, block immediately
                if current_usage >= max_uses:
                    logger.warning(f"VALIDATE_COUPON: Overall usage limit exceeded for '{coupon_code}': {current_usage}/{max_uses}")
                    return 0.0, None, f'This coupon has reached its maximum usage limit ({current_usage}/{max_uses}). Please try a different coupon.'

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
