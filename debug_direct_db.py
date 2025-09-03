#!/usr/bin/env python3
"""
Direct database inspection script to check test5 coupon and orders
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import re

async def inspect_test5_coupon():
    """Direct database inspection to understand the issue"""
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # Admin database for coupons
    admin_db = client.admin
    coupons_collection = admin_db.coupons
    
    # Main database for orders
    main_db = client.MonkeyZ
    orders_collection = main_db.orders
    
    print("=== DIRECT DATABASE INSPECTION ===\n")
    
    # 1. Get test5 coupon
    print("1. COUPON DETAILS:")
    coupon = await coupons_collection.find_one({'code': {'$regex': '^test5$', '$options': 'i'}})
    if coupon:
        print(f"   Found coupon: {coupon}")
        print(f"   maxUsagePerUser type: {type(coupon.get('maxUsagePerUser'))}")
        print(f"   maxUsagePerUser value: {repr(coupon.get('maxUsagePerUser'))}")
    else:
        print("   ❌ test5 coupon not found!")
        return
    
    # 2. Check orders for mrbrownaffiliate@gmail.com
    test_email = "mrbrownaffiliate@gmail.com"
    print(f"\n2. ORDERS FOR {test_email}:")
    
    # Try each email field separately
    email_fields = ['email', 'userEmail', 'customerEmail']
    coupon_fields = ['couponCode', 'coupon_code']
    
    total_found = 0
    
    for email_field in email_fields:
        for coupon_field in coupon_fields:
            query = {
                email_field: {'$regex': f'^{re.escape(test_email)}$', '$options': 'i'},
                coupon_field: {'$regex': '^test5$', '$options': 'i'},
                'status': {'$nin': ['cancelled', 'failed']}
            }
            
            orders = await orders_collection.find(query).to_list(None)
            if orders:
                print(f"   Found {len(orders)} orders with {email_field}+{coupon_field}:")
                for order in orders:
                    email_val = order.get(email_field, 'MISSING')
                    coupon_val = order.get(coupon_field, 'MISSING')
                    print(f"     - Order {order.get('_id')}: {email_field}={email_val}, {coupon_field}={coupon_val}, status={order.get('status')}")
                total_found += len(orders)
    
    print(f"\n   TOTAL ORDERS FOUND: {total_found}")
    
    # 3. Check what the validation logic should return
    max_per_user = coupon.get('maxUsagePerUser', 0)
    print(f"\n3. VALIDATION LOGIC:")
    print(f"   maxUsagePerUser from DB: {max_per_user} (type: {type(max_per_user)})")
    print(f"   User's order count: {total_found}")
    print(f"   Should block: {total_found >= max_per_user if max_per_user > 0 else False}")
    
    if max_per_user > 0 and total_found >= max_per_user:
        print("   ✅ LOGIC: User should be BLOCKED")
    else:
        print("   ❌ LOGIC: User should be ALLOWED")
        if max_per_user <= 0:
            print("      REASON: maxUsagePerUser is 0 or None (unlimited)")
        elif total_found < max_per_user:
            print(f"      REASON: User count ({total_found}) < limit ({max_per_user})")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(inspect_test5_coupon())
