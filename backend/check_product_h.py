#!/usr/bin/env python
# Script to check product H flags
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import os
import certifi
import json
import sys

# Load environment variables
load_dotenv()

async def check_product_h():
    """Check product H flags"""
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        if not mongodb_uri:
            print("MONGODB_URI not found in environment variables")
            return False
            
        # Connect to MongoDB
        print("Connecting to MongoDB...")
        client = motor.motor_asyncio.AsyncIOMotorClient(
            mongodb_uri,
            tlsCAFile=certifi.where()
        )
        
        # Check all possible product collections
        dbs = ["shop", "admin", "monkeyz"]
        collections = ["Product", "products"]
        
        found = False
        
        for db_name in dbs:
            db = client[db_name]
            
            for collection_name in collections:
                try:
                    collection = db[collection_name]
                    
                    # Find product H
                    h_product = await collection.find_one({"name": "H"})
                    if h_product:
                        print(f"Found product H in {db_name}.{collection_name}")
                        found = True
                        
                        # Convert ObjectId to string for JSON serialization
                        h_product["_id"] = str(h_product["_id"])
                        
                        # Print product details
                        print(json.dumps(h_product, indent=2, default=str))
                        
                        # Update it directly
                        print("Updating product H...")
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
                                    "active": True
                                }
                            }
                        )
                        
                        print(f"Update result: {result.modified_count} document modified")
                        
                        # Verify update
                        updated_h = await collection.find_one({"name": "H"})
                        updated_h["_id"] = str(updated_h["_id"])
                        print("Product H after update:")
                        print(json.dumps(updated_h, indent=2, default=str))
                    
                except Exception as e:
                    print(f"Error processing {db_name}.{collection_name}: {str(e)}", file=sys.stderr)
        
        if not found:
            print("Product H was not found in any collection")
        
        return True
        
    except Exception as e:
        print(f"Error checking product H: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    asyncio.run(check_product_h())
