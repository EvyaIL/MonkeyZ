# Script to sync real products from admin.products to shop.products
# Usage: python scripts/sync_admin_to_shop_products.py

import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "shop")

async def sync_admin_to_shop_products():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    admin_products_col = db["admin.products"]
    shop_products_col = db["products"]

    # Fetch all products from admin.products
    admin_products = await admin_products_col.find({}).to_list(None)
    print(f"Found {len(admin_products)} products in admin.products.")

    # Remove all products from shop.products
    delete_result = await shop_products_col.delete_many({})
    print(f"Deleted {delete_result.deleted_count} products from shop.products.")

    # Insert all admin products into shop.products, set active: true
    for product in admin_products:
        product["active"] = True
        # Remove _id to avoid duplicate key error
        if "_id" in product:
            del product["_id"]
    if admin_products:
        insert_result = await shop_products_col.insert_many(admin_products)
        print(f"Inserted {len(insert_result.inserted_ids)} products into shop.products.")
    else:
        print("No products to insert.")

    print("Sync complete.")

if __name__ == "__main__":
    asyncio.run(sync_admin_to_shop_products())
