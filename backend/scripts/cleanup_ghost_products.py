# Script to clean up ghost products from MongoDB
# Run this script in your backend environment (with access to your DB)

import asyncio
import os
import traceback
from beanie import init_beanie
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from src.models.products.products import Product

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "shop")

async def cleanup_ghost_products():
    client = AsyncIOMotorClient(MONGODB_URI)
    # Clean up admin.products collection (remove legacy best_seller fields)
    admin_db = client["admin"]
    admin_products = admin_db["products"]
    result = await admin_products.update_many(
        {"$or": [
            {"is_best_seller": {"$exists": True}},
            {"isBestSeller": {"$exists": True}}
        ]},
        {"$unset": {"is_best_seller": "", "isBestSeller": ""}}
    )
    print(f"[admin.products] Updated {result.modified_count} documents. Removed 'is_best_seller' and 'isBestSeller' fields.")

    # Optionally, keep your original cleanup for ghost/inactive products in the shop DB
    db = client[DB_NAME]
    await init_beanie(database=db, document_models=[Product])

    # Find all products (customize this query if you use soft delete)
    all_products_raw = await db["product"].find({}).to_list(None)
    print(f"Found {len(all_products_raw)} raw products in DB.")

    valid_products = []
    ghost_products = []
    malformed_products = []

    for raw in all_products_raw:
        try:
            product = Product.parse_obj(raw)
            valid_products.append(product)
            if not product.active:
                ghost_products.append(product)
        except Exception as e:
            malformed_products.append(raw.get("_id", "<no id>"))
            print(f"Skipping malformed product: {raw.get('_id', '<no id>')} - {e}")
            traceback.print_exc()

    print(f"Found {len(ghost_products)} ghost/inactive products to delete.")
    print(f"Found {len(malformed_products)} malformed products (not deleted, manual review suggested): {malformed_products}")

    for product in ghost_products:
        print(f"Deleting product: {product.id} - {product.name}")
        await product.delete()

    print("Cleanup complete.")

if __name__ == "__main__":
    asyncio.run(cleanup_ghost_products())
