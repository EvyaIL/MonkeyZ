import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

MONGODB_URI = "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
DB_NAME = "shop"

async def test_connection():
    print("Starting MongoDB connection test...")
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DB_NAME]
        
        # Test if we can get a list of products
        print("Testing connection to products collection...")
        products_count = await db["products"].count_documents({})
        print(f"Connection successful! Found {products_count} products in database.")
        
        # List the first 5 products
        if products_count > 0:
            print("\nListing first 5 products:")
            products = await db["products"].find({}).limit(5).to_list(length=5)
            for i, p in enumerate(products, 1):
                name = p.get('name')
                if isinstance(name, dict):
                    name = name.get('en') or name.get('he') or str(name)
                print(f"{i}. {name}")
        
        client.close()
        return True
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print(f"Python version: {sys.version}")
    try:
        result = asyncio.run(test_connection())
        if result:
            print("\nTest completed successfully!")
        else:
            print("\nTest failed!")
    except Exception as e:
        print(f"Error running test: {e}")
        import traceback
        traceback.print_exc()
