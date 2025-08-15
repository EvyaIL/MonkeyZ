"""
Test Database Connection and Coupon Data
This script verifies that localhost is connecting to the production database.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
src_dir = backend_dir / 'src'
sys.path.insert(0, str(backend_dir))
sys.path.insert(0, str(src_dir))

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

async def test_database_connection():
    """Test that we're connecting to the correct database."""
    
    mongodb_uri = os.getenv("MONGODB_URI")
    print(f"MongoDB URI: {mongodb_uri}")
    
    if not mongodb_uri:
        print("❌ MONGODB_URI not found in environment!")
        return
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_uri)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB")
        
        # Check admin database
        admin_db = client.get_database("admin")
        
        # Check coupons collection
        coupons_collection = admin_db.get_collection("coupons")
        coupon_count = await coupons_collection.count_documents({})
        print(f"📊 Found {coupon_count} coupons in admin.coupons")
        
        # Check for test3 coupon specifically
        test3_coupon = await coupons_collection.find_one({'code': 'test3'})
        if test3_coupon:
            print(f"✅ Found test3 coupon:")
            print(f"   Code: {test3_coupon.get('code')}")
            print(f"   Usage Count: {test3_coupon.get('usageCount', 0)}")
            print(f"   Max Uses: {test3_coupon.get('maxUses', 'unlimited')}")
            print(f"   Active: {test3_coupon.get('active', False)}")
        else:
            print("❌ test3 coupon not found!")
        
        # Check orders collection
        orders_collection = admin_db.get_collection("orders")
        total_orders = await orders_collection.count_documents({})
        print(f"📊 Found {total_orders} total orders in admin.orders")
        
        # Check orders with test3 coupon
        test3_orders = await orders_collection.count_documents({
            'couponCode': {'$regex': '^test3$', '$options': 'i'}
        })
        print(f"📊 Found {test3_orders} orders using test3 coupon")
        
        # List test3 orders details
        test3_order_list = await orders_collection.find({
            'couponCode': {'$regex': '^test3$', '$options': 'i'}
        }).to_list(None)
        
        print(f"\n📋 test3 Order Details:")
        for order in test3_order_list:
            print(f"   Order ID: {order.get('_id')}")
            print(f"   Status: {order.get('status')}")
            print(f"   Email: {order.get('userEmail')}")
            print(f"   Amount: {order.get('amount')}")
            print(f"   Created: {order.get('createdAt')}")
            print("   ---")
        
        # Calculate what usage count should be
        active_test3_orders = await orders_collection.count_documents({
            'couponCode': {'$regex': '^test3$', '$options': 'i'},
            'status': {'$nin': ['cancelled', 'failed']}
        })
        
        print(f"\n🔍 Analysis:")
        if test3_coupon:
            stored_usage = test3_coupon.get('usageCount', 0)
            print(f"   Stored Usage Count: {stored_usage}")
            print(f"   Active Orders: {active_test3_orders}")
            if stored_usage != active_test3_orders:
                print(f"   ❌ MISMATCH! Should be {active_test3_orders}, but shows {stored_usage}")
            else:
                print(f"   ✅ Usage count is correct!")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_database_connection())
