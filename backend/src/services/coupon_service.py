from datetime import datetime, timezone

class CouponService:
    def __init__(self, db):
        self.db = db

    async def validate_coupon(self, coupon_code, original_total):
        """Validate coupon without applying (no usage increment)"""
        if not coupon_code:
            return 0.0, None, 'No coupon code provided.'
        
        # Coupons are stored in admin database, coupons collection
        admin_db = self.db.client.admin
        collection = admin_db.get_collection("coupons")
        
        # Try to find coupon with exact match first
        coupon = await collection.find_one({'code': coupon_code.strip().lower(), 'active': True})
        if not coupon:
            # Fallback: try case-insensitive search
            coupon = await collection.find_one({
                'code': {'$regex': f'^{coupon_code.strip()}$', '$options': 'i'},
                'active': True
            })
        if not coupon:
            return 0.0, None, f"Coupon code '{coupon_code}' not found or not active."
        
        # Check expiry
        expires_at = coupon.get('expiresAt')
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                return 0.0, None, 'Coupon expired.'
        
        # Check max uses
        if coupon.get('maxUses') is not None and coupon.get('usageCount', 0) >= coupon['maxUses']:
            return 0.0, None, 'Coupon usage limit reached.'
        
        # Calculate discount
        discount_amount = 0.0
        if coupon.get('discountType', '').lower() == 'percentage' and coupon.get('discountValue'):
            discount_amount = (original_total * float(coupon['discountValue'])) / 100.0
        elif coupon.get('discountType', '').lower() == 'fixed' and coupon.get('discountValue'):
            discount_amount = float(coupon['discountValue'])
        
        discount_amount = min(discount_amount, original_total)
        return discount_amount, coupon, None

    async def validate_and_apply_coupon(self, coupon_code, original_total):
        """Validate coupon and apply it (with usage increment)"""
        discount_amount, coupon, error = await self.validate_coupon(coupon_code, original_total)
        
        if error or not coupon:
            return discount_amount, coupon, error
        
        # Increment usage count
        admin_db = self.db.client.admin
        collection = admin_db.get_collection("coupons")
        await collection.update_one({'_id': coupon['_id']}, {'$inc': {'usageCount': 1}})
        return discount_amount, coupon, None
