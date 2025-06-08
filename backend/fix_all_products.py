import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("fix_products.log", encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def fix_all_products():
    """Fix all products in all collections to ensure they have both naming conventions"""
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            logger.error("MONGODB_URI not found in environment variables")
            return False
            
        logger.info(f"Connecting to MongoDB...")
        
        # Connect to MongoDB
        client = AsyncIOMotorClient(
            mongodb_uri,
            tlsCAFile=certifi.where()
        )
        
        logger.info("Connected successfully")
        
        # List all databases
        databases = await client.list_database_names()
        logger.info(f"Available databases: {databases}")
        
        # Process all relevant collections
        collections_to_fix = [
            (client.shop.Product, "shop.Product"),
            (client.admin.products, "admin.products"),
            (client.monkeyz.products, "monkeyz.products")
        ]
        
        for collection, name in collections_to_fix:
            count = await collection.count_documents({})
            logger.info(f"\nProcessing {name} collection with {count} documents")
            
            if count == 0:
                logger.info(f"No products in {name}, skipping")
                continue
            
            # Process all products
            async for product in collection.find({}):
                logger.info(f"Fixing product: {product.get('name', 'unknown')}")
                
                # Extract current values with fallbacks
                product_id = product["_id"]
                
                is_new = product.get('is_new', False) or product.get('isNew', False)
                best_seller = product.get('best_seller', False) or product.get('isBestSeller', False)
                display_on_homepage = product.get('display_on_homepage', False) or product.get('displayOnHomepage', False)
                discount_percentage = product.get('discountPercentage', 0)
                active = product.get('active', True)
                
                # Update document with both naming conventions
                update_result = await collection.update_one(
                    {"_id": product_id},
                    {
                        "$set": {
                            "is_new": is_new,
                            "isNew": is_new,
                            "best_seller": best_seller,
                            "isBestSeller": best_seller,
                            "display_on_homepage": display_on_homepage,
                            "displayOnHomepage": display_on_homepage,
                            "discountPercentage": discount_percentage,
                            "active": active
                        }
                    }
                )
                
                logger.info(f"Updated product: {product.get('name', 'unknown')} - Modified: {update_result.modified_count}")
        
        logger.info("\nAll products fixed successfully!")
        
        # Verify products
        logger.info("\nVerifying products...")
        for collection, name in collections_to_fix:
            count = await collection.count_documents({})
            if count > 0:
                sample = await collection.find_one({})
                logger.info(f"{name} sample: is_new={sample.get('is_new')}, isNew={sample.get('isNew')}, " +
                           f"best_seller={sample.get('best_seller')}, isBestSeller={sample.get('isBestSeller')}")
        
        # --- SYNC ADMIN PRODUCTS TO PUBLIC COLLECTION ---
        admin_collection = client.admin.products
        public_collection = client.shop.Product
        
        admin_count = await admin_collection.count_documents({})
        logger.info(f"\nSyncing {admin_count} admin products to public collection...")
        
        async for admin_product in admin_collection.find({}):
            name = admin_product.get("name")
            if not name:
                logger.warning(f"Admin product missing name, skipping: {admin_product}")
                continue
            # --- SLUG GENERATION ---
            slug = admin_product.get("slug")
            if not slug or not isinstance(slug, str) or not slug.strip():
                # Generate slug from name (handle dict or str)
                if isinstance(name, dict):
                    base_name = name.get("en") or name.get("he") or list(name.values())[0]
                else:
                    base_name = name
                slug = str(base_name).strip().lower().replace(" ", "-").replace("/", "-")
                slug = ''.join(c for c in slug if c.isalnum() or c == '-')
            # Ensure slug is unique in public collection
            orig_slug = slug
            i = 1
            while await public_collection.find_one({"slug": slug}):
                slug = f"{orig_slug}-{i}"
                i += 1
            # Try to find by name in public collection
            existing = await public_collection.find_one({"name": name})
            if existing:
                logger.info(f"Product '{name}' already exists in public collection, updating fields...")
                update_fields = admin_product.copy()
                update_fields["active"] = True
                update_fields["slug"] = slug
                update_fields["isNew"] = admin_product.get("isNew", False) or admin_product.get("is_new", False)
                update_fields["isBestSeller"] = admin_product.get("isBestSeller", False) or admin_product.get("best_seller", False)
                update_fields["displayOnHomepage"] = admin_product.get("displayOnHomepage", False) or admin_product.get("display_on_homepage", False)
                update_fields["discountPercentage"] = admin_product.get("discountPercentage", 0) or admin_product.get("discount_percentage", 0)
                update_fields.pop("_id", None)
                await public_collection.update_one({"_id": existing["_id"]}, {"$set": update_fields})
            else:
                logger.info(f"Inserting new product '{name}' into public collection...")
                new_product = admin_product.copy()
                new_product["active"] = True
                new_product["slug"] = slug
                new_product["isNew"] = admin_product.get("isNew", False) or admin_product.get("is_new", False)
                new_product["isBestSeller"] = admin_product.get("isBestSeller", False) or admin_product.get("best_seller", False)
                new_product["displayOnHomepage"] = admin_product.get("displayOnHomepage", False) or admin_product.get("display_on_homepage", False)
                new_product["discountPercentage"] = admin_product.get("discountPercentage", 0) or admin_product.get("discount_percentage", 0)
                new_product.pop("_id", None)
                await public_collection.insert_one(new_product)
        logger.info("\nAdmin products successfully synced to public collection!")
        
        return True
    
    except Exception as e:
        logger.error(f"Error fixing products: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting product field fix...")
    asyncio.run(fix_all_products())
    logger.info("Product fix process completed")
