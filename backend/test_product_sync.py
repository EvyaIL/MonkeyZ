#!/usr/bin/env python3
"""
Test script to verify product synchronization between admin and main collections.
"""
import asyncio
import os
import sys
from datetime import datetime

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.deps.deps import get_products_controller_dependency
from src.controller.product_controller import ProductsController

async def test_product_sync():
    """Test the product synchronization functionality."""
    print("🧪 Testing Product Synchronization...")
    print("=" * 50)
    
    try:
        # Get the products controller
        products_controller: ProductsController = get_products_controller_dependency()
        await products_controller.initialize()
        
        print("✅ ProductsController initialized successfully")
        
        # Test 1: Get all admin products
        print("\n📋 Test 1: Getting admin products...")
        admin_products = await products_controller.get_admin_products()
        print(f"Found {len(admin_products)} admin products")
        
        # Test 2: Get all main collection products
        print("\n📋 Test 2: Getting main collection products...")
        main_products = await products_controller.product_collection.get_all_products()
        print(f"Found {len(main_products)} main collection products")
        
        # Test 3: Create a test product via admin
        print("\n📋 Test 3: Creating a test product via admin...")
        test_product_data = {
            "name": f"Test Product {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test product created via admin to verify sync",
            "price": 99.99,
            "imageUrl": "https://example.com/test-image.jpg",
            "active": True,
            "category": "test",
            "createdAt": datetime.now(),
            "updatedAt": datetime.now(),
            "metadata": {
                "translations": {
                    "name": {"en": f"Test Product {datetime.now().strftime('%H%M%S')}"},
                    "description": {"en": "This is a test product created via admin to verify sync"}
                }
            }
        }
        
        created_product = await products_controller.create_admin_product(test_product_data)
        print(f"✅ Created test product: {created_product.name}")
        
        # Test 4: Verify the product exists in main collection
        print("\n📋 Test 4: Verifying product exists in main collection...")
        main_products_after = await products_controller.product_collection.get_all_products()
        print(f"Main collection now has {len(main_products_after)} products")
        
        # Find our test product in main collection
        test_product_in_main = None
        for product in main_products_after:
            if hasattr(product, 'name') and product.name == created_product.name:
                test_product_in_main = product
                break
        
        if test_product_in_main:
            print(f"✅ Test product found in main collection: {test_product_in_main.name}")
        else:
            print("❌ Test product NOT found in main collection")
        
        # Test 5: Manual sync test
        print("\n📋 Test 5: Running manual sync...")
        await products_controller.sync_products()
        print("✅ Manual sync completed")
        
        # Final verification
        print("\n📋 Final verification...")
        final_main_products = await products_controller.product_collection.get_all_products()
        print(f"Final main collection count: {len(final_main_products)}")
        
        print("\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        try:
            await products_controller.disconnect()
            print("✅ Disconnected from collections")
        except:
            pass

if __name__ == "__main__":
    asyncio.run(test_product_sync())
