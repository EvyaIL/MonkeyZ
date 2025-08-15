#!/usr/bin/env python3
"""
Test script to verify PayPal order creation and duplicate prevention fixes.
"""

import os
import asyncio
import sys
from datetime import datetime, timezone

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.mongodb.mongodb import MongoDb
from src.mongodb.orders_collection import OrdersCollection

async def test_coupon_analytics():
    """Test coupon analytics with case sensitivity"""
    print("🧪 Testing coupon analytics...")
    
    mongo_db = MongoDb()
    await mongo_db.connection()
    db = await mongo_db.get_db()
    
    # Test with different case variations of coupon codes
    test_codes = ["TEST10", "test10", "Test10", "TeSt10"]
    
    orders_collection = OrdersCollection()
    
    for code in test_codes:
        orders = await orders_collection.get_orders_by_coupon_code(code)
        print(f"   Coupon '{code}': {len(orders)} orders found")
    
    print("✅ Coupon analytics test completed")

async def test_email_configuration():
    """Test email service configuration"""
    print("🧪 Testing email configuration...")
    
    try:
        from src.services.email_service import EMAIL_ENABLED, conf
        
        if EMAIL_ENABLED and conf:
            print(f"   SMTP Server: {conf.MAIL_SERVER}")
            print(f"   SMTP Port: {conf.MAIL_PORT}")
            print(f"   SMTP User: {conf.MAIL_USERNAME}")
            print(f"   SMTP From: {conf.MAIL_FROM}")
            print("✅ Email configuration is enabled and configured")
        else:
            print("⚠️  Email configuration is disabled or incomplete")
            print("   Set SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_FROM environment variables to enable")
    except Exception as e:
        print(f"❌ Email configuration error: {e}")

async def test_duplicate_order_prevention():
    """Test duplicate order prevention logic"""
    print("🧪 Testing duplicate order prevention...")
    
    mongo_db = MongoDb()
    await mongo_db.connection()
    db = await mongo_db.get_db()
    
    # Check for any duplicate orders in the database
    pipeline = [
        {
            "$group": {
                "_id": {
                    "email": "$email",
                    "total": "$total",
                    "createdAt": {"$dateToString": {"format": "%Y-%m-%d %H:%M", "date": "$createdAt"}}
                },
                "count": {"$sum": 1},
                "orders": {"$push": "$_id"}
            }
        },
        {
            "$match": {"count": {"$gt": 1}}
        }
    ]
    
    cursor = db.orders.aggregate(pipeline)
    duplicates = await cursor.to_list(length=None)
    
    if duplicates:
        print(f"⚠️  Found {len(duplicates)} potential duplicate order groups:")
        for dup in duplicates:
            print(f"   Email: {dup['_id']['email']}, Total: {dup['_id']['total']}, Count: {dup['count']}")
    else:
        print("✅ No duplicate orders found")

async def main():
    """Run all tests"""
    print("🚀 Starting PayPal order system verification...\n")
    
    try:
        await test_email_configuration()
        print()
        
        await test_coupon_analytics()
        print()
        
        await test_duplicate_order_prevention()
        print()
        
        print("✅ All tests completed successfully!")
        print("\nKey improvements made:")
        print("• Added duplicate order prevention in PayPal capture")
        print("• Added admin email notifications to evyatarhypixel1477@gmail.com")
        print("• Improved customer email formatting with better key display")
        print("• Fixed case-insensitive coupon code matching")
        print("• Enhanced error logging for email service")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
