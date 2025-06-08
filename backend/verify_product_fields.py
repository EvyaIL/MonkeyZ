import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

async def create_test_products():
    """Create test products with all the required fields in MongoDB."""
    mongo_uri = os.getenv("MONGODB_URI")
    
    if not mongo_uri:
        print("MONGODB_URI environment variable is not set.")
        return
    
    print(f"Connecting to MongoDB...")
    
    try:
        # Create client
        client = AsyncIOMotorClient(mongo_uri)
        
        # Test connection with ping
        await client.admin.command('ping')
        print("Connected successfully!")
        
        # Get shop database
        db = client.get_database("shop")
        
        # Check products collection
        products_collection = db.products
        
        # Count total products
        total_count = await products_collection.count_documents({})
        print(f"Total products in database: {total_count}")
        
        # Create test products with required flags
        await create_test_products_with_fields(products_collection)
        
        # Check products collection again after creating test products
        total_count = await products_collection.count_documents({})
        print(f"\nAfter creating test products, total count: {total_count}")
        
        # Count products with special flags
        best_seller_count = await products_collection.count_documents({"best_seller": True})
        print(f"Products marked as best_seller: {best_seller_count}")
        
        homepage_count = await products_collection.count_documents({"display_on_homepage": True})
        print(f"Products marked for homepage display: {homepage_count}")
        
        new_count = await products_collection.count_documents({"is_new": True})
        print(f"Products marked as new: {new_count}")
        
        discount_count = await products_collection.count_documents({"discountPercentage": {"$gt": 0}})
        print(f"Products with discount: {discount_count}")
        
        # Show a sample product
        sample = await products_collection.find_one({"best_seller": True})
        if sample:
            print("\nSample best seller product:")
            print(json.dumps({k: str(v) if k == "_id" else v for k, v in sample.items()}, indent=2))
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        client.close()

async def create_test_products_with_fields(collection):
    """Create test products with all required fields properly set."""
    try:
        # Create new test products with the correct fields
        products = [
            {
                "name": "Best Seller Test Product",
                "description": "This is a test product marked as best seller",
                "price": 99.99,
                "active": True,
                "created_at": datetime.now(),
                "best_seller": True,  # MongoDB field for best sellers
                "display_on_homepage": False,
                "is_new": False,
                "discountPercentage": 0,
                "keys": {},
                "category": "Testing"
            },
            {
                "name": "Homepage Test Product",
                "description": "This is a test product marked for homepage display",
                "price": 89.99,
                "active": True,
                "created_at": datetime.now(),
                "best_seller": False,
                "display_on_homepage": True,  # MongoDB field for homepage display
                "is_new": False,
                "discountPercentage": 0,
                "keys": {},
                "category": "Testing"
            },
            {
                "name": "New Product Test",
                "description": "This is a test product marked as new",
                "price": 79.99,
                "active": True,
                "created_at": datetime.now(),
                "best_seller": False,
                "display_on_homepage": False,
                "is_new": True,  # MongoDB field for new products
                "discountPercentage": 0,
                "keys": {},
                "category": "Testing"
            },
            {
                "name": "13% Discount Test Product",
                "description": "This is a test product with 13% discount",
                "price": 69.99,
                "active": True,
                "created_at": datetime.now(),
                "best_seller": False,
                "display_on_homepage": False,
                "is_new": False,
                "discountPercentage": 13,  # MongoDB field for discount percentage
                "keys": {},
                "category": "Testing"
            },
            {
                "name": "Complete Test Product",
                "description": "This product has all special flags enabled",
                "price": 59.99,
                "active": True,
                "created_at": datetime.now(),
                "best_seller": True,
                "display_on_homepage": True,
                "is_new": True,
                "discountPercentage": 25,
                "keys": {},
                "category": "Testing"
            }
        ]
        
        # Insert products
        for product in products:
            # Check if product with the same name already exists
            existing = await collection.find_one({"name": product["name"]})
            if existing:
                print(f"Product '{product['name']}' already exists, updating...")
                await collection.update_one({"name": product["name"]}, {"$set": product})
            else:
                print(f"Creating new product: '{product['name']}'")
                await collection.insert_one(product)
                
        print("\nTest products created or updated successfully!")
        
    except Exception as e:
        print(f"Error creating test products: {str(e)}")

# Run the async function
if __name__ == "__main__":
    asyncio.run(create_test_products())
