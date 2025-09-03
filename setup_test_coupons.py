import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_and_fix_coupons():
    """
    Debug the current coupon system and create test coupons
    """
    print("🔍 Debugging Coupon Database...")
    
    # Connect to MongoDB (same connection as the backend)
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # Check both databases
    main_db = client.MonkeyZ
    admin_db = client.admin
    
    print("\n📊 Database Analysis:")
    
    # Check main database coupons
    main_coupons = main_db.coupons
    main_count = await main_coupons.count_documents({})
    print(f"MonkeyZ.coupons: {main_count} documents")
    
    if main_count > 0:
        main_samples = await main_coupons.find({}).limit(3).to_list(length=3)
        print("Sample coupons from MonkeyZ:")
        for coupon in main_samples:
            print(f"  - {coupon.get('code')}: active={coupon.get('active')}, maxUses={coupon.get('maxUses')}")
    
    # Check admin database coupons
    admin_coupons = admin_db.coupons
    admin_count = await admin_coupons.count_documents({})
    print(f"\nadmin.coupons: {admin_count} documents")
    
    if admin_count > 0:
        admin_samples = await admin_coupons.find({}).limit(3).to_list(length=3)
        print("Sample coupons from admin:")
        for coupon in admin_samples:
            print(f"  - {coupon.get('code')}: active={coupon.get('active')}, maxUses={coupon.get('maxUses')}")
    
    # Check orders for coupon usage
    orders = main_db.orders
    orders_count = await orders.count_documents({})
    print(f"\nMonkeyZ.orders: {orders_count} documents")
    
    # Find orders with coupons
    coupon_orders = await orders.find({
        "$or": [
            {"couponCode": {"$exists": True, "$ne": None}},
            {"coupon_code": {"$exists": True, "$ne": None}}
        ]
    }).limit(5).to_list(length=5)
    
    print(f"Orders with coupons: {len(coupon_orders)}")
    for order in coupon_orders:
        coupon_code = order.get('couponCode') or order.get('coupon_code')
        print(f"  - Order {order.get('_id')}: coupon='{coupon_code}', status={order.get('status')}")
    
    print("\n🛠️  Creating Test Coupons...")
    
    # Create comprehensive test coupons in the admin database
    test_coupons = [
        {
            "code": "TEST10",
            "discountType": "percentage",
            "discountValue": 10,
            "maxUses": 2,
            "maxUsagePerUser": 1,
            "usageCount": 0,
            "userUsages": {},
            "active": True,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
            "createdAt": datetime.now(timezone.utc),
            "description": "Test coupon - 10% off, max 2 uses, 1 per user"
        },
        {
            "code": "SAVE20",
            "discountType": "fixed",
            "discountValue": 20,
            "maxUses": 5,
            "maxUsagePerUser": 2,
            "usageCount": 0,
            "userUsages": {},
            "active": True,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
            "createdAt": datetime.now(timezone.utc),
            "description": "Test coupon - $20 off, max 5 uses, 2 per user"
        },
        {
            "code": "UNLIMITED",
            "discountType": "percentage",
            "discountValue": 5,
            "maxUses": 0,  # 0 means unlimited
            "maxUsagePerUser": 0,  # 0 means unlimited per user
            "usageCount": 0,
            "userUsages": {},
            "active": True,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
            "createdAt": datetime.now(timezone.utc),
            "description": "Test coupon - 5% off, unlimited uses"
        },
        {
            "code": "EXPIRED",
            "discountType": "percentage",
            "discountValue": 15,
            "maxUses": 10,
            "maxUsagePerUser": 3,
            "usageCount": 0,
            "userUsages": {},
            "active": True,
            "expiresAt": datetime.now(timezone.utc) - timedelta(days=1),  # Expired yesterday
            "createdAt": datetime.now(timezone.utc) - timedelta(days=5),
            "description": "Test coupon - expired (for testing expiration logic)"
        }
    ]
    
    # Insert test coupons
    for coupon in test_coupons:
        # Check if coupon already exists
        existing = await admin_coupons.find_one({"code": coupon["code"]})
        if existing:
            print(f"⚠️  Coupon {coupon['code']} already exists, updating...")
            await admin_coupons.replace_one({"code": coupon["code"]}, coupon)
        else:
            print(f"✅ Creating coupon {coupon['code']}")
            await admin_coupons.insert_one(coupon)
    
    print(f"\n✅ Created {len(test_coupons)} test coupons in admin database")
    
    # Verify creation
    final_count = await admin_coupons.count_documents({})
    print(f"Total coupons in admin database: {final_count}")
    
    client.close()
    
    print("\n🎯 Test Coupons Created:")
    print("- TEST10: 10% off, max 2 uses total, 1 per user")
    print("- SAVE20: $20 off, max 5 uses total, 2 per user") 
    print("- UNLIMITED: 5% off, unlimited uses")
    print("- EXPIRED: 15% off, expired (for testing)")
    print("\nYou can now test the coupon system with these codes!")

if __name__ == "__main__":
    asyncio.run(debug_and_fix_coupons())
