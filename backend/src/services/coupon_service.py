from datetime import datetime, timezone

class CouponService:
    def __init__(self, db):
        self.db = db

    async def validate_coupon(self, coupon_code, original_total, user_email=None):
        """
        Validates a coupon's eligibility but does NOT modify its usage count.
        
        This function checks for:
        - Existence and activation status.
        - Expiration date.
        - Overall usage limit (`maxUses`).
        - Per-user usage limit (`maxUsagePerUser`), based on COMPLETED orders.
        
        Returns the discount amount, the coupon object, and any error message.
        """
        try:
            if not coupon_code:
                return 0.0, None, 'No coupon code provided.'
            admin_db = self.db.client.admin
            collection = admin_db.get_collection("coupons")
            code = coupon_code.strip().lower()
            coupon = await collection.find_one({'code': code, 'active': True})
            if not coupon:
                coupon = await collection.find_one({'code': {'$regex': f'^{code}$', '$options': 'i'}, 'active': True})
            if not coupon:
                return 0.0, None, f"Coupon code '{coupon_code}' not found or not active."

            # --- Expiration Check ---
            expires_at = coupon.get('expiresAt')
            if expires_at:
                # If expires_at is a string, parse to datetime
                if isinstance(expires_at, str):
                    try:
                        expires_at = datetime.fromisoformat(expires_at)
                    except Exception:
                        # Unable to parse, skip expiration check
                        expires_at = None
                if expires_at:
                    if expires_at.tzinfo is None:
                        expires_at = expires_at.replace(tzinfo=timezone.utc)
                    if expires_at < datetime.now(timezone.utc):
                        return 0.0, None, 'Coupon expired.'

            # --- Overall Usage Limit Check ---
            # This check is based on `usageCount`, which should only reflect completed orders.
            if coupon.get('maxUses') is not None and coupon.get('usageCount', 0) >= coupon['maxUses']:
                return 0.0, None, 'Coupon usage limit reached.'

            # --- Per-User Usage Limit Check ---
            # This check is based on `userUsages`, which should only reflect completed orders.
            max_per_user = coupon.get('maxUsagePerUser', 0)
            user_usages = coupon.get('userUsages', {}) # This should only contain completed orders.
            if user_email and max_per_user > 0:
                user_completed_count = user_usages.get(user_email, 0)
                if user_completed_count >= max_per_user:
                    return 0.0, None, f'You have already used this coupon the maximum number of times ({max_per_user}).'

            # --- Calculate Discount ---
            discount = 0.0
            dtype = coupon.get('discountType', '').lower()
            dval = coupon.get('discountValue')
            if dtype == 'percentage' and dval is not None:
                discount = (original_total * float(dval)) / 100.0
            elif dtype == 'fixed' and dval is not None:
                discount = float(dval)
            discount = min(discount, original_total)
            return discount, coupon, None
        except Exception as e:
            return 0.0, None, str(e)

    async def validate_and_apply_coupon(self, coupon_code, original_total, user_email=None):
        """
        DEPRECATED: This function is deprecated in favor of calling validate_coupon and then
        recalculate_coupon_analytics from the endpoint. It no longer applies the coupon.
        """
        # This function now only serves as a wrapper for validation.
        # The responsibility of "applying" (i.e., recalculating analytics) is now in the endpoint.
        return await self.validate_coupon(coupon_code, original_total, user_email=user_email)
