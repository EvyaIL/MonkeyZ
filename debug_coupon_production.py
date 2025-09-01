#!/usr/bin/env python3
"""
Debug script to investigate coupon validation differences between localhost and production.
This script will help identify why the same coupon validation works differently.
"""

import asyncio
import sys
import os
import logging
from datetime import datetime, timezone

# Add the backend src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from mongodb.mongodb import MongoDb
from services.coupon_service import CouponService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_coupon_validation():
    """Debug coupon validation for a specific user and coupon."""
    
    print("🔍 MonkeyZ Coupon Validation Debug Tool")
    print("=" * 50)
    
    # Get input parameters
    coupon_code = input("Enter coupon code to test: ").strip()
    user_email = input("Enter user email to test: ").strip()
    
    if not coupon_code or not user_email:
        print("❌ Both coupon code and email are required")
        return
    
    try:
        # Initialize database connection
        mongo_db = MongoDb()
        db = await mongo_db.get_db()
        coupon_service = CouponService(db)
        
        print(f"\n🎯 Testing coupon '{coupon_code}' for user '{user_email}'")
        print("-" * 50)
        
        # Step 1: Check if coupon exists
        admin_db = db.client.get_database("admin")
        collection = admin_db.get_collection("coupons")
        code = coupon_code.strip().lower()
        
        coupon = await collection.find_one({'code': {'$regex': f'^{code}$', '$options': 'i'}, 'active': True})
        
        if not coupon:
            print("❌ Coupon not found or not active")
            return
        
        print("✅ Coupon found and active")
        print(f"   Code: {coupon.get('code')}")
        print(f"   Max uses: {coupon.get('maxUses', 'Unlimited')}")
        print(f"   Max usage per user: {coupon.get('maxUsagePerUser', 'Unlimited')}")
        print(f"   Discount: {coupon.get('discountValue')}% ({coupon.get('discountType', 'percentage')})")
        
        # Step 2: Check userUsages field
        user_usages = coupon.get('userUsages', {})
        print(f"\n📊 User Usage Data from coupon.userUsages:")
        if user_usages:
            print(f"   Total users tracked: {len(user_usages)}")
            user_usage_count = user_usages.get(user_email, 0)
            print(f"   Usage for {user_email}: {user_usage_count}")
            
            # Show all users for debugging
            print("   All user usages:")
            for email, count in user_usages.items():
                print(f"     {email}: {count}")
        else:
            print("   ❌ userUsages field is empty or missing")
        
        # Step 3: Check orders collection
        print(f"\n📋 Order History Check:")
        orders_collection = db.orders
        
        # Search with different email field variations
        email_queries = [
            {'userEmail': user_email},
            {'email': user_email}, 
            {'customerEmail': user_email}
        ]
        
        for i, query in enumerate(email_queries):
            field_name = list(query.keys())[0]
            order_count = await orders_collection.count_documents({
                **query,
                'couponCode': {'$regex': f'^{coupon["code"]}$', '$options': 'i'},
                'status': {'$nin': ['cancelled', 'failed']}
            })
            print(f"   Orders with {field_name}={user_email}: {order_count}")
        
        # Combined query (what the actual validation uses)
        combined_query = {
            '$or': email_queries,
            'couponCode': {'$regex': f'^{coupon["code"]}$', '$options': 'i'},
            'status': {'$nin': ['cancelled', 'failed']}
        }
        total_order_count = await orders_collection.count_documents(combined_query)
        print(f"   Total valid orders (combined query): {total_order_count}")
        
        # Step 4: Show actual orders for debugging
        orders = []
        async for order in orders_collection.find(combined_query).limit(5):
            orders.append(order)
        
        if orders:
            print(f"\n📄 Recent Orders (showing up to 5):")
            for order in orders:
                order_id = order.get('_id', 'Unknown')
                status = order.get('status', 'Unknown')
                coupon_used = order.get('couponCode', 'None')
                email_fields = [
                    order.get('userEmail'),
                    order.get('email'),
                    order.get('customerEmail')
                ]
                found_email = next((e for e in email_fields if e), 'Not found')
                print(f"     Order {order_id}: status={status}, coupon={coupon_used}, email={found_email}")
        
        # Step 5: Test actual validation
        print(f"\n🧪 Running Actual Validation:")
        discount_amount, coupon_obj, error = await coupon_service.validate_coupon(
            coupon_code, 100.0, user_email
        )
        
        if error:
            print(f"   ❌ Validation failed: {error}")
        else:
            print(f"   ✅ Validation passed: ${discount_amount} discount")
        
        # Step 6: Environment information
        print(f"\n🌍 Environment Information:")
        print(f"   Database name: {db.name}")
        print(f"   MongoDB URI: {os.getenv('MONGODB_URI', 'Not set')[:50]}...")
        print(f"   Environment: {os.getenv('ENVIRONMENT', 'Not set')}")
        
        # Step 7: Recommendations
        print(f"\n💡 Debug Recommendations:")
        if user_usages and user_email in user_usages:
            print("   ✅ userUsages field contains data - this should be working correctly")
        else:
            print("   ⚠️  userUsages field is empty - validation falls back to order queries")
            print("   💡 Consider running coupon analytics recalculation")
        
        if total_order_count > 0:
            print(f"   📊 Found {total_order_count} orders in database")
        else:
            print("   ⚠️  No orders found - might be database sync issue")
        
    except Exception as e:
        logger.error(f"Debug failed: {e}")
        print(f"❌ Debug failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_coupon_validation())
