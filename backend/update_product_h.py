#!/usr/bin/env python
# Script to update product H with the missing flags
import os
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import certifi
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("update_product_h.log")
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def update_product_h():
    """Update product H with the missing flags"""
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            logger.error("MONGODB_URI not found in environment variables")
            return False
            
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongodb_uri,
            tlsCAFile=certifi.where()
        )
        
        logger.info("Connected to MongoDB")
        
        # Check all possible product collections
        dbs = ["shop", "admin", "monkeyz"]
        collections = ["Product", "products"]
        
        product_found = False
        
        for db_name in dbs:
            db = client[db_name]
            
            for collection_name in collections:
                try:
                    collection = db[collection_name]
                    
                    # Find product H
                    product = await collection.find_one({"name": "H"})
                    if product:
                        product_found = True
                        logger.info(f"Found product H in {db_name}.{collection_name}")
                        
                        # Update with all the required flags
                        result = await collection.update_one(
                            {"name": "H"},
                            {
                                "$set": {
                                    # Both naming conventions for flags
                                    "is_new": True,
                                    "isNew": True,
                                    "best_seller": True,
                                    "isBestSeller": True,
                                    "display_on_homepage": True,
                                    "displayOnHomepage": True,
                                    "discount_percentage": 15,
                                    "discountPercentage": 15,
                                    "updatedAt": client.server_info()["localTime"]
                                }
                            }
                        )
                        
                        if result.modified_count > 0:
                            logger.info(f"Successfully updated product H with required flags")
                        else:
                            logger.warning(f"No changes made to product H")
                        
                        # Get updated product
                        updated = await collection.find_one({"name": "H"})
                        logger.info(f"Product H flags after update: new={updated.get('isNew')}, best_seller={updated.get('isBestSeller')}, homepage={updated.get('displayOnHomepage')}, discount={updated.get('discountPercentage')}%")
                        
                except Exception as e:
                    logger.error(f"Error checking {db_name}.{collection_name}: {str(e)}")
        
        if not product_found:
            logger.warning("Product H not found in any collection")
            return False
            
        logger.info("Product update operation completed")
        return True
        
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(update_product_h())
