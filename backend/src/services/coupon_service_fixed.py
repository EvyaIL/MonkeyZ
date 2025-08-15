from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class CouponService:
    def __init__(self, db):
        self.db = db

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
            
            # Find the coupon
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
            current_usage = coupon.get('usageCount', 0)
            max_uses = coupon.get('maxUses')
            if max_uses is not None and current_usage >= max_uses:
                return 0.0, None, f'Coupon usage limit reached ({current_usage}/{max_uses}).'

            # --- Per-User Usage Limit Check ---
            if user_email:
                max_usage_per_user = coupon.get('maxUsagePerUser', 0)
                if max_usage_per_user > 0:
                    # Count how many times this user has used this coupon
                    orders_collection = self.db.orders
                    user_usage_count = await orders_collection.count_documents({
                        'email': user_email,
                        'couponCode': code,
                        'status': {'$in': ['completed', 'confirmed']}
                    })
                    
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
            
            # --- INCREMENT USAGE COUNT ---
            await collection.update_one(
                {'code': code},
                {'$inc': {'usageCount': 1}}
            )
            
            return discount_amount, coupon, None
            
        except Exception as e:
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
            current_usage = coupon.get('usageCount', 0)
            max_uses = coupon.get('maxUses')
            if max_uses is not None and current_usage >= max_uses:
                return 0.0, None, f'Coupon usage limit reached ({current_usage}/{max_uses}).'

            # --- Per-User Usage Limit Check ---
            if user_email:
                max_usage_per_user = coupon.get('maxUsagePerUser', 0)
                if max_usage_per_user > 0:
                    # Count how many times this user has used this coupon
                    orders_collection = self.db.orders
                    user_usage_count = await orders_collection.count_documents({
                        'email': user_email,
                        'couponCode': code,
                        'status': {'$in': ['completed', 'confirmed']}
                    })
                    
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
            return 0.0, None, f'Error validating coupon: {str(e)}' 

    async def validate_and_apply_coupon(self, coupon_code, total, user_email=None):
        """
        DEPRECATED: Use apply_coupon() instead for real usage, validate_coupon() for preview.
        """
        return await self.validate_coupon(coupon_code, total, user_email)
