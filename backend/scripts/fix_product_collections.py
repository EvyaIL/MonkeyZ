#!/usr/bin/env python3
"""
Fix product collections by ensuring:
1. All products are stored in admin.Product (not shop.Product)
2. displayOnHomePage flag is correctly set and honored
3. All products have a valid slug
"""
import os
import re
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from unidecode import unidecode
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1")

async def generate_slug(name):
    """Generate a slug from a product name"""
    if not name:
        timestamp = int(datetime.utcnow().timestamp())
        return f"product-{timestamp}"
    
    # Handle dict names
    if isinstance(name, dict):
        name = name.get('en') or next(iter(name.values()), "")
    
    # Generate basic slug
    slug_base = unidecode(name)  # Convert accented characters to ASCII
    # Replace non-alphanumeric characters with dashes
    slug_base = re.sub(r'[^\w\s-]', '', slug_base.lower())
    # Replace spaces and multiple dashes with single dash
    slug_base = re.sub(r'[\s-]+', '-', slug_base).strip('-')
    
    # Add timestamp to ensure uniqueness
    timestamp = int(datetime.utcnow().timestamp())
    return f"{slug_base}-{timestamp}"

async def fix_product_collections():
    """Fix issues with product collections"""
    client = AsyncIOMotorClient(MONGO_URI)
    
    # Get collections from both admin and shop databases
    admin_db = client["admin"]
    shop_db = client["shop"]
    
    # Get collections - ensure we're looking at the right collections used by Beanie
    admin_products_col = admin_db["Product"] 
    shop_products_col = shop_db["Product"]
    
    print("Starting product collection fix...")
    
    # 1. Get all products from both collections
    admin_products = await admin_products_col.find().to_list(None)
    shop_products = await shop_products_col.find().to_list(None)
    
    print(f"Found {len(admin_products)} products in admin.Product")
    print(f"Found {len(shop_products)} products in shop.Product")
    
    # 2. Ensure all products from shop are in admin
    shop_to_admin_count = 0
    for shop_product in shop_products:
        # Extract the product ID
        shop_product_id = str(shop_product["_id"])
        
        # Check if this product exists in admin collection
        admin_product = await admin_products_col.find_one({"_id": shop_product["_id"]})
        
        if not admin_product:
            # If not in admin, add it
            shop_product_copy = shop_product.copy()
            
            # Make sure we have all required fields
            if "slug" not in shop_product_copy or not shop_product_copy["slug"]:
                shop_product_copy["slug"] = await generate_slug(shop_product_copy.get("name"))
            
            await admin_products_col.insert_one(shop_product_copy)
            shop_to_admin_count += 1
    
    print(f"Copied {shop_to_admin_count} products from shop.Product to admin.Product")
    
    # 3. Update all admin products to ensure they have proper fields
    update_count = 0
    slug_count = 0
    
    # Re-fetch to get the complete list after updates
    all_admin_products = await admin_products_col.find().to_list(None)
    
    for product in all_admin_products:
        updates = {}
        
        # Ensure displayOnHomePage exists and is a boolean
        if "displayOnHomePage" not in product or not isinstance(product["displayOnHomePage"], bool):
            updates["displayOnHomePage"] = False
        
        # Ensure slug exists
        if "slug" not in product or not product["slug"]:
            updates["slug"] = await generate_slug(product.get("name"))
            slug_count += 1
        
        # Apply updates if needed
        if updates:
            await admin_products_col.update_one({"_id": product["_id"]}, {"$set": updates})
            update_count += 1
    
    print(f"Updated {update_count} products in admin.Product")
    print(f"Generated slugs for {slug_count} products")
    
    # 4. Clear shop collection and re-sync from admin
    delete_result = await shop_products_col.delete_many({})
    print(f"Deleted {delete_result.deleted_count} products from shop.Product")
    
    # 5. Copy all admin products to shop (keeping their IDs)
    new_admin_products = await admin_products_col.find().to_list(None)
    for admin_product in new_admin_products:
        shop_product = admin_product.copy()
        await shop_products_col.insert_one(shop_product)
    
    print(f"Synced {len(new_admin_products)} products from admin.Product to shop.Product")
    
    print("Product collection fix complete!")

if __name__ == "__main__":
    asyncio.run(fix_product_collections())
