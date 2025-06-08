# Product field standardization script for deployment
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import os
import datetime
import certifi
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("product_standardization.log")
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def standardize_product_fields():
    """Standardize product fields across all collections to ensure compatibility"""
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
        
        for db_name in dbs:
            db = client[db_name]
            
            for collection_name in collections:
                try:
                    collection = db[collection_name]
                    count = await collection.count_documents({})
                    
                    if count > 0:
                        logger.info(f"Found {count} products in {db_name}.{collection_name}")
                        
                        # Update all products to have both naming conventions
                        result = await collection.update_many(
                            {},  # Match all documents
                            {
                                "$set": {
                                    "updatedAt": datetime.datetime.utcnow()
                                }
                            }
                        )
                        logger.info(f"Updated {result.modified_count} products in {db_name}.{collection_name}")
                        
                        # Standardize special flags (new, best seller, homepage, discount)
                        products = await collection.find({}).to_list(length=None)
                        
                        for product in products:
                            # Get existing values with fallbacks
                            is_new = product.get("is_new", False) or product.get("isNew", False)
                            is_best_seller = product.get("best_seller", False) or product.get("isBestSeller", False)
                            is_homepage = product.get("display_on_homepage", False) or product.get("displayOnHomepage", False)
                            discount = product.get("discountPercentage", 0)
                            
                            # Update with both naming conventions to ensure compatibility
                            await collection.update_one(
                                {"_id": product["_id"]},
                                {
                                    "$set": {
                                        "is_new": is_new,
                                        "isNew": is_new,
                                        "best_seller": is_best_seller,
                                        "isBestSeller": is_best_seller,
                                        "display_on_homepage": is_homepage,
                                        "displayOnHomepage": is_homepage,
                                        "discountPercentage": discount,
                                        "active": product.get("active", True)
                                    }
                                }
                            )
                        
                        logger.info(f"Standardized all products in {db_name}.{collection_name}")
                        
                except Exception as e:
                    logger.error(f"Error processing {db_name}.{collection_name}: {str(e)}")
        
        logger.info("Product field standardization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error during product field standardization: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting product field standardization")
    success = asyncio.run(standardize_product_fields())
    
    if success:
        logger.info("Product field standardization completed successfully")
    else:
        logger.error("Product field standardization failed")
