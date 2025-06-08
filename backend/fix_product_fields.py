# Script to fix MongoDB product collections and add required fields
import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
from bson import ObjectId
import datetime

# Load environment variables
load_dotenv()

# MongoDB connection string
# Using the connection string from .env file
MONGODB_URI = os.getenv("MONGODB_URI") or "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
# No need for separate user and password since they're in the connection string
MONGODB_USER = None
MONGODB_PASSWORD = None

async def main():
    # Connect to MongoDB (authentication is already in the URI)
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
    
    print(f"Connected to MongoDB at {MONGODB_URI}")
    
    # List all databases to check connection
    dbs = await client.list_database_names()
    print(f"Available databases: {dbs}")
      # Check all databases for products
    dbs_to_check = ["admin", "shop", "monkeyz"]
    
    for db_name in dbs_to_check:
        print(f"\nChecking {db_name} database...")
        db = client[db_name]
        
        # Check collections in this database
        collection_names = await db.list_collection_names()
        print(f"Collections in {db_name} database: {collection_names}")
        
        # Check if 'products' or 'Product' collection exists
        if "products" in collection_names:
            print(f"Found products collection in {db_name} database")
            count = await db.products.count_documents({})
            print(f"Products count: {count}")
            if count > 0:
                print(f"Using existing products collection in {db_name} database")
                products = db.products
                break
        
        if "Product" in collection_names:
            print(f"Found Product collection in {db_name} database")
            count = await db.Product.count_documents({})
            print(f"Products count: {count}")
            if count > 0:
                print(f"Using existing Product collection in {db_name} database")
                products = db.Product
                break
    
    # If no populated collection was found, use admin.products as default
    if "products" not in locals():
        print("No populated product collection found. Using admin.products as default.")
        products = client.admin.products
    
    # Count documents before adding
    count_before = await products.count_documents({})
    print(f"Products count before: {count_before}")
    
    # Sample products with both naming conventions for special flags
    sample_products = [
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
        },
        {
            "name": "Standard Monitor",
            "description": "24-inch LCD monitor with HD resolution",
            "price": 159.99,
            "imageUrl": "https://images.unsplash.com/photo-1585792180666-f7347c490ee2",
            "active": True,
            "category": "Monitors",
            "isNew": False,
            "is_new": False,
            "isBestSeller": False,
            "best_seller": False,
            "displayOnHomepage": False,
            "display_on_homepage": False,
            "discountPercentage": 0,
            "createdAt": datetime.datetime.utcnow(),
            "updatedAt": datetime.datetime.utcnow(),
            "metadata": {"brand": "ViewClear", "resolution": "1920x1080"}
        }
    ]
    
    # Add sample products if none exist
    if count_before == 0:
        print("Adding sample products...")
        result = await products.insert_many(sample_products)
        print(f"Inserted {len(result.inserted_ids)} sample products")
    else:
        print(f"Found {count_before} existing products. Updating them with required fields...")
        
        # Update existing products to ensure they have the required fields
        existing_products = await products.find({}).to_list(length=100)
        
        for product in existing_products:
            product_id = product["_id"]
            
            # Prepare update with both naming conventions
            update = {
                "$set": {
                    "isNew": product.get("isNew", False) or product.get("is_new", False),
                    "is_new": product.get("isNew", False) or product.get("is_new", False),
                    "isBestSeller": product.get("isBestSeller", False) or product.get("best_seller", False),
                    "best_seller": product.get("isBestSeller", False) or product.get("best_seller", False),
                    "displayOnHomepage": product.get("displayOnHomepage", False) or product.get("display_on_homepage", False),
                    "display_on_homepage": product.get("displayOnHomepage", False) or product.get("display_on_homepage", False),
                    "discountPercentage": product.get("discountPercentage", 0),
                    "updatedAt": datetime.datetime.utcnow()
                }
            }
            
            await products.update_one({"_id": product_id}, update)
            print(f"Updated product: {product.get('name', 'Unknown')}")
    
    # Verify the final state
    final_count = await products.count_documents({})
    print(f"Final product count: {final_count}")
    
    # Check fields in a sample product
    if final_count > 0:
        sample = await products.find_one({})
        print(f"\nSample product fields:")
        for key, value in sample.items():
            print(f"  {key}: {value}")
    
    print("\nScript completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
