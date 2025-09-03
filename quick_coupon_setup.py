# Quick script to manually insert test coupons for testing
import sys
import os
import asyncio
from datetime import datetime, timezone, timedelta

# Add the backend source to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from mongodb.mongodb import MongoDb

async def quick_coupon_setup():
    """
    Manually create test coupons using the same database connection as the backend
    """
    print("🔧 Quick Coupon Setup for Testing...")
    
    # Use the same MongoDB connection as the backend
    mongo = MongoDb()
    await mongo.connection()
    
    # Get the admin database (where coupons are stored)
    admin_db = mongo.client.get_database("admin")
    coupons_collection = admin_db.get_collection("coupons")
    
    # Test coupons with specific scenarios
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
            "description": "Test: 10% off, 2 max total, 1 per user"
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
            "description": "Test: $20 off, 5 max total, 2 per user"
        },
        {
            "code": "UNLIMITED",
            "discountType": "percentage",
            "discountValue": 5,
            "maxUses": 0,  # 0 = unlimited
            "maxUsagePerUser": 0,  # 0 = unlimited per user
            "usageCount": 0,
            "userUsages": {},
            "active": True,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
            "createdAt": datetime.now(timezone.utc),
            "description": "Test: 5% off, unlimited usage"
        }
    ]
    
    print(f"📝 Inserting {len(test_coupons)} test coupons...")
    
    for coupon in test_coupons:
        # Remove existing coupon if it exists
        await coupons_collection.delete_many({"code": coupon["code"]})
        
        # Insert new coupon
        result = await coupons_collection.insert_one(coupon)
        print(f"✅ Created {coupon['code']}: {coupon['description']}")
    
    # Verify insertion
    total_coupons = await coupons_collection.count_documents({})
    print(f"\n📊 Total coupons in admin.coupons: {total_coupons}")
    
    # List all coupons
    all_coupons = await coupons_collection.find({}).to_list(length=10)
    for coupon in all_coupons:
        print(f"  - {coupon['code']}: {coupon.get('description', 'No description')}")
    
    print("\n🎯 Test coupons ready!")
    print("You can now test with: TEST10, SAVE20, UNLIMITED")

if __name__ == "__main__":
    asyncio.run(quick_coupon_setup())
