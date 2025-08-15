# Temporary debug endpoint to test coupon application
# Add this to orders.py temporarily for testing

@router.post("/debug/apply-coupon")
async def debug_apply_coupon(payload: dict):
    """
    TEMPORARY DEBUG ENDPOINT - Remove this after testing!
    Manually applies a coupon to test usage tracking.
    """
    try:
        coupon_code = payload.get("code")
        amount = payload.get("amount", 100)
        email = payload.get("email", "debug@test.com")
        
        if not coupon_code:
            return {"error": "No coupon code provided"}
        
        # Get database connection like in the capture process
        from ..deps.deps import get_user_controller_dependency
        user_controller = get_user_controller_dependency()
        
        if not hasattr(user_controller.product_collection, 'db') or user_controller.product_collection.db is None:
            await user_controller.product_collection.initialize()
            
        db = user_controller.product_collection.db
        
        # Apply the coupon (this should increment usage)
        coupon_service = CouponService(db)
        discount_applied, coupon_obj, apply_error = await coupon_service.apply_coupon(
            coupon_code, amount, email
        )
        
        if apply_error:
            return {
                "success": False,
                "error": apply_error,
                "debug_info": {
                    "database": str(db.name if db else "None"),
                    "coupon_code": coupon_code,
                    "amount": amount,
                    "email": email
                }
            }
        
        return {
            "success": True,
            "discount_applied": discount_applied,
            "coupon_used_count": coupon_obj.get("used", "unknown") if coupon_obj else "no_coupon_obj",
            "debug_info": {
                "database": str(db.name if db else "None"),
                "coupon_code": coupon_code,
                "amount": amount,
                "email": email
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Exception: {str(e)}",
            "debug_info": {
                "exception_type": str(type(e).__name__)
            }
        }
