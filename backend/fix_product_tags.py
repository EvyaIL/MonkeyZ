#!/usr/bin/env python
# Script to fix product tags issues in MongoDB
import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import certifi
from bson import ObjectId
import datetime

# Load environment variables
load_dotenv()

async def fix_product_tags():
    """
    Fix product tags by adding both naming conventions to all products
    and creating test products if needed
    """
    print("Starting product tags fix...")
    
    # Get MongoDB URI from environment
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("MONGODB_URI not found in environment variables")
        return False
        
    print(f"Connecting to MongoDB...")
    
    # Connect to MongoDB
    client = motor.motor_asyncio.AsyncIOMotorClient(
        mongodb_uri,
        tlsCAFile=certifi.where()
    )
    
    # Check connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB successfully")
    except Exception as e:
        print(f"MongoDB connection failed: {str(e)}")
        return False
    
    # Process products in all potential collections
    db_list = ["shop", "admin"]
    collection_names = ["products", "Product"]
    
    fixed_count = 0
    
    for db_name in db_list:
        db = client[db_name]
        for coll_name in collection_names:
            if coll_name not in await db.list_collection_names():
                continue
                
            print(f"Checking {db_name}.{coll_name}...")
            collection = db[coll_name]
            
            # Get all products
            products = await collection.find({}).to_list(length=1000)
            print(f"Found {len(products)} products in {db_name}.{coll_name}")
            
            # Fix each product
            for product in products:
                changes = {}
                product_id = product["_id"]
                product_name = product.get("name", "Unknown")
                
                # Check and add both naming conventions for best_seller/isBestSeller
                is_best_seller = product.get("best_seller", False) or product.get("isBestSeller", False)
                if product.get("best_seller") != is_best_seller:
                    changes["best_seller"] = is_best_seller
                if product.get("isBestSeller") != is_best_seller:
                    changes["isBestSeller"] = is_best_seller
                
                # Check and add both naming conventions for is_new/isNew
                is_new = product.get("is_new", False) or product.get("isNew", False)
                if product.get("is_new") != is_new:
                    changes["is_new"] = is_new
                if product.get("isNew") != is_new:
                    changes["isNew"] = is_new
                
                # Check and add both naming conventions for display_on_homepage/displayOnHomepage
                display_home = product.get("display_on_homepage", False) or product.get("displayOnHomepage", False)
                if product.get("display_on_homepage") != display_home:
                    changes["display_on_homepage"] = display_home
                if product.get("displayOnHomepage") != display_home:
                    changes["displayOnHomepage"] = display_home
                
                # Check and add both naming conventions for discount_percentage/discountPercentage
                discount = product.get("discount_percentage", 0) or product.get("discountPercentage", 0)
                if product.get("discount_percentage") != discount:
                    changes["discount_percentage"] = discount
                if product.get("discountPercentage") != discount:
                    changes["discountPercentage"] = discount
                    
                # Add active field if missing
                if "active" not in product:
                    changes["active"] = True
                
                # Update the product if any changes
                if changes:
                    result = await collection.update_one(
                        {"_id": product_id},
                        {"$set": changes}
                    )
                    if result.modified_count > 0:
                        fixed_count += 1
                        print(f"Fixed product {product_name} with changes: {changes}")
    
    # Create test products if no products exist
    if fixed_count == 0:
        await create_test_products(client.shop.products)
    
    print(f"Fixed {fixed_count} products. Process complete!")
    return True

async def create_test_products(collection):
    """Create test products with both field naming conventions"""
    print("Creating test products...")
    
    # Define test products with both field naming conventions
    test_products = [
        {
            "name": "Premium VPN Service",
            "description": "Secure your connection with our top-rated VPN service.",
            "price": 49.99,
            "image": "https://images.unsplash.com/photo-1562813733-b31f1c638768",
            "best_seller": True,
            "isBestSeller": True,
            "display_on_homepage": True,
            "displayOnHomepage": True,
            "active": True,
            "created_at": datetime.datetime.now(),
            "createdAt": datetime.datetime.now(),
            "discountPercentage": 15,
            "discount_percentage": 15
        },
        {
            "name": "Windows 11 Pro License Key",
            "description": "Genuine Windows 11 Pro license for lifetime activation.",
            "price": 129.99,
            "image": "https://images.unsplash.com/photo-1624571409108-e9a41746af53",
            "is_new": True,
            "isNew": True,
            "display_on_homepage": True,
            "displayOnHomepage": True,
            "active": True,
            "created_at": datetime.datetime.now(),
            "createdAt": datetime.datetime.now()
        },
        {
            "name": "Premium Antivirus Suite",
            "description": "Complete protection against viruses, malware, and online threats.",
            "price": 59.99,
            "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c",
            "is_new": True,
            "isNew": True,
            "best_seller": True,
            "isBestSeller": True,
            "active": True,
            "created_at": datetime.datetime.now(),
            "createdAt": datetime.datetime.now()
        }
    ]
    
    # Insert test products
    for product in test_products:
        # Check if product with this name already exists
        existing = await collection.find_one({"name": product["name"]})
        if not existing:
            result = await collection.insert_one(product)
            print(f"Created test product: {product['name']} with ID: {result.inserted_id}")

if __name__ == "__main__":
    print("Running product tags fix script...")
    asyncio.run(fix_product_tags())
