#!/usr/bin/env python3
"""
Script to clean up invalid orderId values in product cdKeys.
This script will find and remove invalid orderId values that are not valid ObjectIds.
"""

import asyncio
import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from mongodb.mongodb import MongoDb
from bson import ObjectId
from bson.errors import InvalidId
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def cleanup_invalid_order_ids():
    """Clean up invalid orderId values in product cdKeys."""
    
    try:
        # Initialize database connection
        mongo_db = MongoDb()
        db = await mongo_db.get_db()
        
        # Get the products collection
        products_collection = db.products
        
        # Find all products with cdKeys
        cursor = products_collection.find({"cdKeys": {"$exists": True, "$ne": []}})
        
        updated_count = 0
        total_invalid_ids = 0
        
        async for product in cursor:
            product_id = str(product.get('_id'))
            cd_keys = product.get('cdKeys', [])
            
            updated_keys = []
            product_has_invalid_ids = False
            
            for key_data in cd_keys:
                if 'orderId' in key_data and key_data['orderId']:
                    try:
                        # Try to validate the orderId as an ObjectId
                        ObjectId(key_data['orderId'])
                        # If valid, keep as is
                        updated_keys.append(key_data)
                    except (InvalidId, TypeError, ValueError):
                        # Invalid orderId found
                        logger.info(f"Found invalid orderId '{key_data['orderId']}' in product {product_id}")
                        key_data['orderId'] = None
                        updated_keys.append(key_data)
                        product_has_invalid_ids = True
                        total_invalid_ids += 1
                else:
                    # No orderId or already None
                    updated_keys.append(key_data)
            
            # Update the product if we found invalid IDs
            if product_has_invalid_ids:
                await products_collection.update_one(
                    {"_id": product['_id']},
                    {"$set": {"cdKeys": updated_keys}}
                )
                updated_count += 1
                logger.info(f"Updated product {product_id}")
        
        logger.info(f"Cleanup completed!")
        logger.info(f"Products updated: {updated_count}")
        logger.info(f"Invalid orderIds cleaned: {total_invalid_ids}")
        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise
    finally:
        # Close database connection
        await mongo_db.close()

if __name__ == "__main__":
    asyncio.run(cleanup_invalid_order_ids())
