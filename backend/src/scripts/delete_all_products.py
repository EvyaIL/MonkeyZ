# This script will delete all products from both the admin and main products collections in MongoDB using Beanie ODM.
import asyncio
from beanie import init_beanie
import motor.motor_asyncio
from src.models.products.products import Product
from src.mongodb.product_collection import Product as AdminProduct
import os
from dotenv import load_dotenv

async def delete_all_products():
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        print("MONGODB_URI not set in .env!")
        return
    print(f"Connecting to MongoDB: {mongo_uri}")
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()
    print(f"Using database: {db.name}")
    print(f"Collections: {await db.list_collection_names()}")
    print("Deleting all documents from 'products' collection...")
    result1 = await db.products.delete_many({})
    print(f"Deleted {result1.deleted_count} from products.")
    print("Deleting all documents from 'admin_products' collection...")
    result2 = await db.admin_products.delete_many({})
    print(f"Deleted {result2.deleted_count} from admin_products.")

if __name__ == "__main__":
    asyncio.run(delete_all_products())
