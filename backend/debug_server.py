# Script to debug backend server issues
import sys
import os
import asyncio
import logging
import traceback
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi
import json

# Configure logging
try:
    log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend_debug.log")
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_file, encoding='utf-8')
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info(f"Logging to file: {log_file}")
except Exception as log_error:
    print(f"Error setting up logging: {log_error}")
    # Fallback to basic logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def debug_server_issues():
    """Debug the backend server issues causing 500 errors"""
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            logger.error("MONGODB_URI not found in environment variables")
            return False
            
        logger.info(f"Using MongoDB URI: {mongodb_uri}")
        
        # Connect to MongoDB
        client = AsyncIOMotorClient(
            mongodb_uri,
            tlsCAFile=certifi.where()
        )
        
        logger.info("Connected to MongoDB successfully")
        
        # List all databases
        databases = await client.list_database_names()
        logger.info(f"Available databases: {databases}")
        
        # Diagnose issues with product collections
        for db_name in ['admin', 'shop', 'monkeyz']:
            db = client[db_name]
            collections = await db.list_collection_names()
            
            logger.info(f"\nCollections in {db_name}: {collections}")
            
            # Look for products collections
            for collection_name in ['products', 'Product', 'product']:
                if collection_name in collections:
                    count = await db[collection_name].count_documents({})
                    logger.info(f"- {db_name}.{collection_name} has {count} documents")
                    
                    if count > 0:
                        # Get sample product
                        sample = await db[collection_name].find_one({})
                        logger.info(f"Sample document fields: {list(sample.keys())}")
                        
                        # Check for missing fields
                        standard_fields = [
                            'is_new', 'isNew', 'best_seller', 'isBestSeller', 
                            'display_on_homepage', 'displayOnHomepage', 'discountPercentage'
                        ]
                        
                        missing_fields = [field for field in standard_fields if field not in sample]
                        
                        if missing_fields:
                            logger.info(f"Missing fields in {db_name}.{collection_name}: {missing_fields}")
                            
                            # Add missing fields
                            logger.info(f"Adding missing fields to all documents in {db_name}.{collection_name}")
                            
                            # Get all products
                            products = await db[collection_name].find({}).to_list(length=100)
                            
                            for product in products:
                                product_id = product["_id"]
                                
                                # Create update with default values for missing fields
                                update = {"$set": {}}
                                
                                # Check for each naming convention
                                is_new = False
                                best_seller = False
                                display_on_homepage = False
                                discount_percentage = 0
                                
                                # Get existing values with fallbacks
                                if 'is_new' in product or 'isNew' in product:
                                    is_new = product.get('is_new', False) or product.get('isNew', False)
                                
                                if 'best_seller' in product or 'isBestSeller' in product:
                                    best_seller = product.get('best_seller', False) or product.get('isBestSeller', False)
                                
                                if 'display_on_homepage' in product or 'displayOnHomepage' in product:
                                    display_on_homepage = product.get('display_on_homepage', False) or product.get('displayOnHomepage', False)
                                
                                if 'discountPercentage' in product:
                                    discount_percentage = product.get('discountPercentage', 0)
                                
                                # Add missing fields
                                if 'is_new' not in product:
                                    update["$set"]["is_new"] = is_new
                                
                                if 'isNew' not in product:
                                    update["$set"]["isNew"] = is_new
                                
                                if 'best_seller' not in product:
                                    update["$set"]["best_seller"] = best_seller
                                
                                if 'isBestSeller' not in product:
                                    update["$set"]["isBestSeller"] = best_seller
                                
                                if 'display_on_homepage' not in product:
                                    update["$set"]["display_on_homepage"] = display_on_homepage
                                
                                if 'displayOnHomepage' not in product:
                                    update["$set"]["displayOnHomepage"] = display_on_homepage
                                
                                if 'discountPercentage' not in product:
                                    update["$set"]["discountPercentage"] = discount_percentage
                                
                                # Check if there's anything to update
                                if update["$set"]:
                                    result = await db[collection_name].update_one({"_id": product_id}, update)
                                    logger.info(f"Updated product {product.get('name', 'unknown')} in {db_name}.{collection_name}: {update['$set']}")
        
        # Fix specific issues in products_collection.py
        logger.info("\nChecking for product schema definition issues:")
        schema_issues = []
        
        # Workaround: Check if there might be a field naming mismatch causing 500 errors
        # in shop.Product collection
        shop_products = client.shop.Product
        if await shop_products.count_documents({}) > 0:
            logger.info("Updating shop.Product to ensure field consistency")
            
            # Update all products to use both field naming conventions
            for doc in await shop_products.find({}).to_list(length=100):
                if 'name' in doc:
                    product_id = doc['_id']
                    
                    # Get field values
                    is_new = doc.get('is_new', False) or doc.get('isNew', False)
                    best_seller = doc.get('best_seller', False) or doc.get('isBestSeller', False)
                    display_on_homepage = doc.get('display_on_homepage', False) or doc.get('displayOnHomepage', False)
                    discount_percentage = doc.get('discountPercentage', 0)
                    
                    # Set both naming conventions
                    await shop_products.update_one(
                        {"_id": product_id},
                        {
                            "$set": {
                                "isNew": is_new,
                                "is_new": is_new,
                                "best_seller": best_seller,
                                "isBestSeller": best_seller,
                                "display_on_homepage": display_on_homepage,
                                "displayOnHomepage": display_on_homepage,
                                "discountPercentage": discount_percentage,
                                "active": doc.get("active", True)
                            }
                        }
                    )
        
        # Create test products if no products exist
        admin_products = client.admin.products
        if await admin_products.count_documents({}) == 0:
            logger.info("No products found in admin.products, creating test products")
            
            # Create sample products
            sample_products = [
                {
                    "name": "VPN Service",
                    "description": "Secure VPN service for privacy protection",
                    "price": 49.99,
                    "imageUrl": "https://images.unsplash.com/photo-1562813733-b31f1c638768",
                    "active": True,
                    "category": "Security",
                    "isNew": True,
                    "is_new": True,
                    "isBestSeller": True,
                    "best_seller": True,
                    "displayOnHomepage": True,
                    "display_on_homepage": True,
                    "discountPercentage": 15
                },
                {
                    "name": "Password Manager",
                    "description": "Secure password management solution",
                    "price": 39.99,
                    "imageUrl": "https://images.unsplash.com/photo-1633265486064-086b219458ec",
                    "active": True,
                    "category": "Security",
                    "isNew": False,
                    "is_new": False,
                    "isBestSeller": True,
                    "best_seller": True,
                    "displayOnHomepage": True,
                    "display_on_homepage": True,
                    "discountPercentage": 10
                },
                {
                    "name": "Cloud Storage",
                    "description": "Secure cloud storage solution",
                    "price": 29.99,
                    "imageUrl": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7",
                    "active": True,
                    "category": "Storage",
                    "isNew": True,
                    "is_new": True,
                    "isBestSeller": False,
                    "best_seller": False,
                    "displayOnHomepage": True,
                    "display_on_homepage": True,
                    "discountPercentage": 0
                }
            ]
            
            # Insert sample products
            result = await admin_products.insert_many(sample_products)
            logger.info(f"Created {len(result.inserted_ids)} sample products in admin.products")
            
            # Copy to shop.Product
            shop_products = client.shop.Product
            for product in sample_products:
                # Copy product data
                await shop_products.insert_one(product)
            
            logger.info(f"Copied products to shop.Product")
            
        logger.info("Backend debugging completed.")
        return True
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    logger.info("Starting backend server debugging")
    asyncio.run(debug_server_issues())
