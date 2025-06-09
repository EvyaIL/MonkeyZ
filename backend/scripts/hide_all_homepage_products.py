#!/usr/bin/env python3
"""
Force set displayOnHomePage=False for all products, including those where the field is missing or null.
"""
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os

MONGO_URI = os.environ.get("MONGODB_URI", "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1")
DB_NAME = "admin"
COLLECTION_NAME = "products"

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    # Update all products where displayOnHomePage is missing or null
    result1 = await collection.update_many({"displayOnHomePage": {"$exists": False}}, {"$set": {"displayOnHomePage": False}})
    result2 = await collection.update_many({"displayOnHomePage": None}, {"$set": {"displayOnHomePage": False}})
    result3 = await collection.update_many({}, {"$set": {"displayOnHomePage": False}})
    print(f"Updated {result1.modified_count + result2.modified_count + result3.modified_count} products. All products now have displayOnHomePage: false.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
