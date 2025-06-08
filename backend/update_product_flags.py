#!/usr/bin/env python
# Script to update product flags for all products including "H"
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import os
import certifi
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def update_product_flags():
    """Update product flags for all products including "H" """
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            logger.error("MONGODB_URI not found in environment variables")
            return False
            
        # Connect to MongoDB
        logger.info("Connecting to MongoDB...")
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongodb_uri,
            tlsCAFile=certifi.where()
        )
        
        # Check all possible product collections
        dbs = ["shop", "admin", "monkeyz"]
        collections = ["Product", "products"]
        
        product_h_updated = False
        
        for db_name in dbs:
            db = client[db_name]
            
            for collection_name in collections:
                try:
                    collection = db[collection_name]
                    count = await collection.count_documents({})
                    
                    if count > 0:
                        logger.info(f"Found {count} products in {db_name}.{collection_name}")
                        
                        # Process product "H" specifically first
                        h_product = await collection.find_one({"name": "H"})
                        if h_product:
                            logger.info(f"Found product H in {db_name}.{collection_name}, updating...")
                            
                            # Update product "H" with all required flags
                            result = await collection.update_one(
                                {"name": "H"},
                                {
                                    "$set": {
                                        "is_new": True,
                                        "isNew": True,
                                        "best_seller": True,
                                        "isBestSeller": True,
                                        "display_on_homepage": True,
                                        "displayOnHomepage": True,
                                        "discountPercentage": 15,
                                        "discount_percentage": 15,
                                        "active": True,
                                        "updatedAt": datetime.utcnow()
                                    }
                                }
                            )
                            
                            logger.info(f"Product H updated: {result.modified_count} document modified")
                            product_h_updated = True
                            
                            # Verify update
                            updated_h = await collection.find_one({"name": "H"})
                            logger.info(f"Product H after update: {updated_h}")
                        
                        # Also update all other products to ensure they have proper flags
                        # This ensures best sellers section and homepage have products
                        other_products = await collection.find({"name": {"$ne": "H"}}).to_list(length=None)
                        
                        # Update at least 5 products to be best sellers and homepage
                        count_updated = 0
                        for product in other_products[:5]:
                            await collection.update_one(
                                {"_id": product["_id"]},
                                {
                                    "$set": {
                                        "is_new": True,
                                        "isNew": True,
                                        "best_seller": True,
                                        "isBestSeller": True,
                                        "display_on_homepage": True,
                                        "displayOnHomepage": True,
                                        "discountPercentage": 10,
                                        "discount_percentage": 10,
                                        "active": True,
                                        "updatedAt": datetime.utcnow()
                                    }
                                }
                            )
                            count_updated += 1
                        
                        logger.info(f"Updated {count_updated} additional products")
                        
                except Exception as e:
                    logger.error(f"Error processing {db_name}.{collection_name}: {str(e)}")
        
        if product_h_updated:
            logger.info("Product H was successfully updated")
        else:
            logger.warning("Product H was not found in any collection")
        
        logger.info("Product flag update completed")
        return True
        
    except Exception as e:
        logger.error(f"Error updating product flags: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(update_product_flags())
