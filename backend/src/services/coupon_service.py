from datetime import datetime, timezone

class CouponService:
    def __init__(self, db):
        self.db = db

    async def validate_coupon(self, coupon_code, original_total, user_email=None):
        """Validate coupon without applying (no usage increment). Enforces expiry, max total, and max per-user usage."""
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
            if coupon.get('maxUses') is not None and coupon.get('usageCount', 0) >= coupon['maxUses']:
                return 0.0, None, 'Coupon usage limit reached.'
            # --- ENFORCE MAX USAGES PER USER ---
            max_per_user = coupon.get('maxUsagePerUser', 0)
            user_usages = coupon.get('userUsages', {})
            if user_email and max_per_user:
                user_count = user_usages.get(user_email, 0)
                if user_count >= max_per_user:
                    return 0.0, None, f'Maximum uses per user reached ({max_per_user}).'
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
        """Validate coupon and apply it (NO usage increment here)."""
        # Only validate and return discount, do NOT increment usage here!
        return await self.validate_coupon(coupon_code, original_total, user_email=user_email)
