# Test script for the key metrics controller
import asyncio
import sys
import os

# Add the parent directory to the path so we can import the modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.controller.key_metrics_controller import KeyMetricsController
from src.mongodb.product_collection import ProductCollection
from src.mongodb.keys_collection import KeysCollection
from src.models.products.products import Product, CDKey
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from pydantic import Field, BaseModel
from typing import List, Optional
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def main():
    print("Starting key metrics controller test")
    
    # Initialize MongoDB connection
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("Error: MONGODB_URI not set")
        return
    
    print(f"Connecting to MongoDB at {mongo_uri}")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_database("shop")
    
    # Initialize Beanie
    await init_beanie(database=db, document_models=[Product])
    
    # Initialize collections
    product_collection = ProductCollection()
    await product_collection.initialize()
    
    keys_collection = KeysCollection()
    await keys_collection.initialize()
    
    # Initialize KeyMetricsController
    key_metrics_controller = KeyMetricsController(product_collection, keys_collection)
    
    # Get metrics
    print("Getting key metrics...")
    metrics = await key_metrics_controller.get_key_metrics()
    
    # Print metrics in a nice format
    print("\n=== Key Metrics ===")
    print(f"Total Keys: {metrics['totalKeys']}")
    print(f"Available Keys: {metrics['availableKeys']}")
    print(f"Used Keys: {metrics['usedKeys']}")
    print(f"Expired Keys: {metrics['expiredKeys']}")
    print(f"Low Stock Products: {metrics['lowStockProducts']}")
    print(f"Average Key Usage Time: {metrics['averageKeyUsageTime']}")
    
    print("\n=== Key Usage By Product ===")
    for product in metrics['keyUsageByProduct']:
        print(f"Product ID: {product['productId']}")
        print(f"Product Name: {product['productName']}")
        print(f"Total Keys: {product['totalKeys']}")
        print(f"Available Keys: {product['availableKeys']}")
        print(f"Used Keys: {product.get('usedKeys', 0)}")
        print("---")

if __name__ == "__main__":
    asyncio.run(main())
