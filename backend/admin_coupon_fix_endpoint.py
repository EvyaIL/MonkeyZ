"""
Admin endpoint to fix coupon userUsages data in production.
Add this to your FastAPI backend as an admin endpoint.

You can add this to your backend/src/routers/admin.py or create a new admin router.
"""

from fastapi import APIRouter, HTTPException, Depends
from src.database import get_database
import asyncio
from datetime import datetime
import logging

# Create admin router (add this to your existing admin.py or create new file)
admin_router = APIRouter(prefix="/admin", tags=["admin"])

@admin_router.post("/fix-coupon-usage")
async def fix_coupon_usage_data():
    """
    Admin endpoint to fix coupon userUsages data.
    
    This will:
    1. Find all coupons with per-user limits
    2. Count actual usage from orders collection
    3. Update userUsages field to match reality
    """
    try:
        db = await get_database()
        
        # Get all coupons with per-user limits
        coupons_collection = db.coupons
        orders_collection = db.orders
        
        coupons_with_limits = await coupons_collection.find({
            "maxUsagePerUser": {"$exists": True, "$gt": 0}
        }).to_list(length=None)
        
        print(f"🔍 Found {len(coupons_with_limits)} coupons with per-user limits")
        
        fixes_applied = 0
        
        for coupon in coupons_with_limits:
            coupon_code = coupon.get('code')
            print(f"\n🧪 Processing coupon: {coupon_code}")
            
            # Get all orders that used this coupon
            orders_with_coupon = await orders_collection.find({
                "$or": [
                    {"couponCode": coupon_code},
                    {"coupon_code": coupon_code},
                    {"appliedCoupon.code": coupon_code}
                ],
                "status": {"$ne": "cancelled"}  # Don't count cancelled orders
            }).to_list(length=None)
            
            print(f"   📊 Found {len(orders_with_coupon)} orders using this coupon")
            
            # Count usage per user
            user_usage_counts = {}
            
            for order in orders_with_coupon:
                # Try different email fields
                user_email = None
                for email_field in ['email', 'userEmail', 'customerEmail', 'user_email']:
                    if email_field in order and order[email_field]:
                        user_email = order[email_field].lower().strip()
                        break
                
                if user_email:
                    user_usage_counts[user_email] = user_usage_counts.get(user_email, 0) + 1
            
            print(f"   📈 User usage counts: {user_usage_counts}")
            
            # Update coupon's userUsages field
            if user_usage_counts:
                update_result = await coupons_collection.update_one(
                    {"_id": coupon["_id"]},
                    {"$set": {"userUsages": user_usage_counts}}
                )
                
                if update_result.modified_count > 0:
                    fixes_applied += 1
                    print(f"   ✅ Updated userUsages for coupon {coupon_code}")
                else:
                    print(f"   ⚠️  No update needed for coupon {coupon_code}")
            else:
                # Set empty userUsages if no usage found
                await coupons_collection.update_one(
                    {"_id": coupon["_id"]},
                    {"$set": {"userUsages": {}}}
                )
                print(f"   📝 Set empty userUsages for coupon {coupon_code}")
        
        result = {
            "success": True,
            "message": f"Successfully processed {len(coupons_with_limits)} coupons",
            "coupons_processed": len(coupons_with_limits),
            "fixes_applied": fixes_applied,
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"\n🎉 Fix completed: {result}")
        return result
        
    except Exception as e:
        error_msg = f"Error fixing coupon usage data: {str(e)}"
        print(f"💥 {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@admin_router.get("/coupon-usage-status")
async def get_coupon_usage_status():
    """
    Get current status of coupon usage data.
    Shows which coupons have userUsages data and which don't.
    """
    try:
        db = await get_database()
        coupons_collection = db.coupons
        
        # Get all coupons with per-user limits
        coupons = await coupons_collection.find({
            "maxUsagePerUser": {"$exists": True, "$gt": 0}
        }).to_list(length=None)
        
        status_report = []
        
        for coupon in coupons:
            user_usages = coupon.get('userUsages', {})
            
            status_report.append({
                "code": coupon.get('code'),
                "maxUsagePerUser": coupon.get('maxUsagePerUser'),
                "hasUserUsages": bool(user_usages),
                "userCount": len(user_usages),
                "totalUsages": sum(user_usages.values()) if user_usages else 0,
                "userUsages": user_usages
            })
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "totalCoupons": len(status_report),
            "coupons": status_report
        }
        
    except Exception as e:
        error_msg = f"Error getting coupon status: {str(e)}"
        print(f"💥 {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
