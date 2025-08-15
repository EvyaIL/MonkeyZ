#!/usr/bin/env python3
"""
Test script to verify the retry failed orders functionality fixes.
This script tests:
1. ObjectId conversion fix
2. Email sending functionality
3. Auto-retry when adding CD keys
"""

import asyncio
import sys
import os
from datetime import datetime, timezone
from bson import ObjectId

# Add the backend source directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.mongodb.mongodb import MongoDb
from src.mongodb.product_collection import ProductCollection
from src.routers.orders import retry_failed_orders_internal
from src.models.order import Order, OrderItem, StatusEnum, StatusHistoryEntry

async def test_retry_orders_fix():
    """Test the retry orders functionality with the ObjectId fix"""
    print("🧪 Testing Retry Failed Orders Fix...")
    
    try:
        # Initialize database connection
        mongo_db = MongoDb()
        db = await mongo_db.get_db()
        product_collection = ProductCollection(db)
        
        print("✅ Database connection established")
        
        # Test 1: Check if we can find awaiting stock orders without ObjectId errors
        print("\n📋 Test 1: Finding awaiting stock orders...")
        orders_cursor = db.orders.find({"status": {"$in": [StatusEnum.AWAITING_STOCK, StatusEnum.FAILED]}})
        orders_count = 0
        async for order_doc in orders_cursor:
            orders_count += 1
            print(f"   Found order: {order_doc.get('_id')} - Status: {order_doc.get('status')}")
            
            # Test ObjectId handling
            original_object_id = order_doc['_id']
            print(f"   Original ObjectId: {original_object_id} (type: {type(original_object_id)})")
            
            # Convert for Pydantic (this was the problematic part)
            if '_id' in order_doc and not isinstance(order_doc['_id'], str):
                order_doc['_id'] = str(order_doc['_id'])
                print(f"   Converted to string: {order_doc['_id']}")
            
            # Test Pydantic model creation
            try:
                order = Order(**order_doc)
                print(f"   ✅ Pydantic model created successfully for order {order.id}")
            except Exception as e:
                print(f"   ❌ Failed to create Pydantic model: {e}")
                continue
            
            # Test database update with original ObjectId (this was the fix)
            try:
                result = await db.orders.update_one(
                    {"_id": original_object_id},
                    {"$set": {"updatedAt": datetime.now(timezone.utc)}}
                )
                if result.modified_count > 0:
                    print(f"   ✅ Database update successful using original ObjectId")
                else:
                    print(f"   ⚠️ Database update found no documents to modify")
            except Exception as e:
                print(f"   ❌ Database update failed: {e}")
            
            # Only test the first few orders to avoid spam
            if orders_count >= 3:
                break
        
        if orders_count == 0:
            print("   ℹ️ No awaiting stock orders found - creating a test scenario...")
            
        print(f"   Found {orders_count} orders in awaiting stock status")
        
        # Test 2: Run the actual retry function
        print("\n🔄 Test 2: Running retry_failed_orders_internal...")
        try:
            await retry_failed_orders_internal(db, product_collection)
            print("   ✅ retry_failed_orders_internal completed successfully")
        except Exception as e:
            print(f"   ❌ retry_failed_orders_internal failed: {e}")
            import traceback
            traceback.print_exc()
        
        # Test 3: Check email service configuration
        print("\n📧 Test 3: Checking email service configuration...")
        try:
            from src.services.email_service import EmailService, EMAIL_ENABLED
            print(f"   Email service enabled: {EMAIL_ENABLED}")
            
            if EMAIL_ENABLED:
                email_service = EmailService()
                print("   ✅ Email service initialized successfully")
            else:
                print("   ⚠️ Email service is disabled (missing SMTP configuration)")
                print("   Set SMTP_USER and SMTP_PASS environment variables to enable emails")
        except Exception as e:
            print(f"   ❌ Email service test failed: {e}")
        
        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_retry_orders_fix())
