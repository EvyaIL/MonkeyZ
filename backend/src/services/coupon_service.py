from datetime import datetime, timezone
import logging
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

class CouponService:
    def __init__(self, db):
        self.db = db

    async def get_real_usage_count(self, coupon_code):
        """
        Calculate real-time usage count from orders collection.
        This is the source of truth for coupon usage.
        FIXED: Ensure we check the correct database for orders
        """
        try:
            # Try multiple database locations to find orders
            databases_to_check = [
                self.db,  # Current database
                self.db.client.get_database("admin"),  # Admin database
                self.db.client.get_database("monkeyz"),  # MonkeyZ database
            ]
            
            total_count = 0
            orders_collection = None
            
            for db in databases_to_check:
                try:
                    collection = db.orders
                    # Check if this collection has orders
                    sample_count = await collection.count_documents({})
                    logger.info(f"Database '{db.name}' has {sample_count} total orders")
                    
                    if sample_count > 0:
                        # Count orders with this coupon that are not cancelled
                        count = await collection.count_documents({
                            'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
                            'status': {'$nin': ['cancelled', 'failed']}
                        })
                        logger.info(f"Found {count} orders with coupon '{coupon_code}' in database '{db.name}'")
                        total_count += count
                        orders_collection = collection
                        
                except Exception as db_error:
                    logger.debug(f"Could not check database '{db.name}': {db_error}")
                    continue
            
            logger.info(f"TOTAL real usage count for coupon '{coupon_code}': {total_count}")
            return total_count
            
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
                    # Count how many times this user has used this coupon across all databases
                    user_usage_count = 0
                    
                    # Check multiple database locations for orders
                    databases_to_check = [
                        self.db,  # Current database
                        self.db.client.get_database("admin"),  # Admin database  
                        self.db.client.get_database("monkeyz"),  # MonkeyZ database
                    ]
                    
                    for db in databases_to_check:
                        try:
                            orders_collection = db.orders
                            count = await orders_collection.count_documents({
                                'userEmail': user_email,
                                'couponCode': {'$regex': f'^{coupon["code"]}$', '$options': 'i'},
                                'status': {'$nin': ['cancelled', 'failed']}
                            })
                            user_usage_count += count
                            if count > 0:
                                logger.info(f"User {user_email} used coupon {coupon['code']} {count} times in db '{db.name}'")
                        except Exception as db_error:
                            logger.debug(f"Could not check user usage in database '{db.name}': {db_error}")
                            continue
                    
                    if user_usage_count >= max_usage_per_user:
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
                if max_usage_per_user > 0:
                    # Count how many times this user has used this coupon across all databases
                    user_usage_count = 0
                    
                    # Check multiple database locations for orders
                    databases_to_check = [
                        self.db,  # Current database
                        self.db.client.get_database("admin"),  # Admin database  
                        self.db.client.get_database("monkeyz"),  # MonkeyZ database
                    ]
                    
                    for db in databases_to_check:
                        try:
                            orders_collection = db.orders
                            count = await orders_collection.count_documents({
                                'userEmail': user_email,
                                'couponCode': {'$regex': f'^{coupon["code"]}$', '$options': 'i'},
                                'status': {'$nin': ['cancelled', 'failed']}
                            })
                            user_usage_count += count
                            if count > 0:
                                logger.info(f"VALIDATION: User {user_email} used coupon {coupon['code']} {count} times in db '{db.name}'")
                        except Exception as db_error:
                            logger.debug(f"Could not check user usage in database '{db.name}': {db_error}")
                            continue
                    
                    if user_usage_count >= max_usage_per_user:
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
