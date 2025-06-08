import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import os
import datetime
from pprint import pprint
import certifi
import json

# Load environment variables
load_dotenv()

# MongoDB connection string from .env
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("Error: MONGODB_URI not found in environment variables")
    exit(1)

print(f"Using MongoDB URI: {MONGODB_URI}")

async def main():
    """Test MongoDB connection and check collections"""
    try:
        # Connect with SSL certificate verification
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGODB_URI,
            tlsCAFile=certifi.where()
        )
        
        print("Connected to MongoDB successfully")
        
        # List all databases
        databases = await client.list_database_names()
        print(f"\nAvailable databases: {databases}")
        
        # Check each database for product collections
        for db_name in databases:
            if db_name in ['admin', 'shop', 'monkeyz', 'local', 'config']:
                db = client[db_name]
                collections = await db.list_collection_names()
                
                print(f"\nCollections in {db_name}: {collections}")
                
                # Check for products or Product collections
                if 'products' in collections:
                    count = await db.products.count_documents({})
                    print(f"- {db_name}.products has {count} documents")
                    if count > 0:
                        # Sample document
                        doc = await db.products.find_one({})
                        print("Sample document structure:")
                        print(json.dumps({k: str(v) if k == "_id" else v for k, v in doc.items()}, indent=2))
                
                if 'Product' in collections:
                    count = await db.Product.count_documents({})
                    print(f"- {db_name}.Product has {count} documents")
                    if count > 0:
                        # Sample document
                        doc = await db.Product.find_one({})
                        print("Sample document structure:")
                        print(json.dumps({k: str(v) if k == "_id" else v for k, v in doc.items()}, indent=2))
        
        # Fix products by adding the required fields
        print("\n=== Adding required fields to products ===")
        
        # Update admin.products (where we found data earlier)
        admin_products = client.admin.products
        
        # Check if collection has documents
        count = await admin_products.count_documents({})
        print(f"admin.products has {count} documents")
        
        if count > 0:
            # Update all products with required fields
            updated = await admin_products.update_many(
                {}, 
                {
                    "$set": {
                        "is_new": True,  # Snake case
                        "isNew": True,   # Camel case
                        "best_seller": True,  # Snake case
                        "isBestSeller": True,  # Camel case
                        "display_on_homepage": True,  # Snake case
                        "displayOnHomepage": True,  # Camel case
                        "discountPercentage": 15,
                        "active": True,
                        "updatedAt": datetime.datetime.utcnow()
                    }
                }
            )
            print(f"Updated {updated.modified_count} products in admin.products")
            
            # Now copy these products to shop.Product collection
            shop_product = client.shop.Product
            
            # Clear out shop.Product first
            await shop_product.delete_many({})
            
            # Get all admin products
            admin_products_list = await admin_products.find({}).to_list(length=100)
            
            if admin_products_list:
                # Insert into shop.Product
                for product in admin_products_list:
                    # Remove _id to avoid conflicts
                    product_id = product.pop('_id', None)
                    
                    # Insert into shop.Product
                    result = await shop_product.insert_one(product)
                    print(f"Copied product {product.get('name', 'unknown')} to shop.Product with id: {result.inserted_id}")
            
            print("Finished copying products to shop.Product")
            
        # Also check shop.Product
        count = await client.shop.Product.count_documents({})
        print(f"\nshop.Product now has {count} documents")
        
        # Add test products if no products exist
        if count == 0:
            print("Adding test products to shop.Product...")
            
            # Create test products
            test_products = [
                {
                    "name": "New Gaming Keyboard",
                    "description": "High-performance mechanical gaming keyboard",
                    "price": 89.99,
                    "imageUrl": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef",
                    "active": True,
                    "category": "Gaming",
                    "isNew": True,               # camelCase version
                    "is_new": True,              # snake_case version
                    "isBestSeller": False,
                    "best_seller": False,
                    "displayOnHomepage": True,
                    "display_on_homepage": True,
                    "discountPercentage": 10,
                    "createdAt": datetime.datetime.utcnow(),
                    "updatedAt": datetime.datetime.utcnow(),
                    "metadata": {"brand": "MechaType", "color": "Black"}
                },
                {
                    "name": "Best Selling Headphones",
                    "description": "Noise-canceling wireless headphones",
                    "price": 129.99,
                    "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
                    "active": True,
                    "category": "Audio",
                    "isNew": False,
                    "is_new": False,
                    "isBestSeller": True,
                    "best_seller": True,
                    "displayOnHomepage": True,
                    "display_on_homepage": True,
                    "discountPercentage": 15,
                    "createdAt": datetime.datetime.utcnow(),
                    "updatedAt": datetime.datetime.utcnow(),
                    "metadata": {"brand": "AudioPro", "color": "Silver"}
                },
                {
                    "name": "Discounted Mouse",
                    "description": "Ergonomic wireless mouse with adjustable DPI",
                    "price": 49.99,
                    "imageUrl": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7",
                    "active": True,
                    "category": "Peripherals",
                    "isNew": False,
                    "is_new": False,
                    "isBestSeller": False,
                    "best_seller": False,
                    "displayOnHomepage": False,
                    "display_on_homepage": False,
                    "discountPercentage": 25,
                    "createdAt": datetime.datetime.utcnow(),
                    "updatedAt": datetime.datetime.utcnow(),
                    "metadata": {"brand": "ClickMaster", "color": "Black"}
                }
            ]
            
            # Insert test products
            result = await client.shop.Product.insert_many(test_products)
            print(f"Added {len(result.inserted_ids)} test products to shop.Product")
        
        print("\nMongoDB verification and fixes completed!")
        
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
