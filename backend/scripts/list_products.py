import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
DB_NAME = "shop"

async def list_products():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    products = await db["products"].find({}).to_list(length=100)
    for p in products:
        print(f"name: {p.get('name')}, displayOnHomePage: {p.get('displayOnHomePage')}, active: {p.get('active')}")

if __name__ == "__main__":
    print("Starting list_products.py script...")
    try:
        asyncio.run(list_products())
        print("Script completed successfully!")
    except Exception as e:
        print(f"Error running script: {e}")
        import traceback
        traceback.print_exc()
