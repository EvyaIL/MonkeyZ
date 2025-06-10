print("Script starting...")

try:
    import asyncio
    print("asyncio imported successfully")
    
    from motor.motor_asyncio import AsyncIOMotorClient
    print("motor imported successfully")
    
    MONGODB_URI = "mongodb+srv://doadmin:MOpg1x782Wj94t56@mongodb1-92cc6b02.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mongodb1"
    DB_NAME = "shop"
    
    async def test_connection():
        print("Connecting to database...")
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[DB_NAME]
        
        # Count products
        count = await db["products"].count_documents({})
        print(f"Total products in database: {count}")
        
        # List first 5 products
        products = await db["products"].find({}).limit(5).to_list(length=5)
        print("First 5 products:")
        for p in products:
            name = p.get('name')
            if isinstance(name, dict):
                name = name.get('en') or name.get('he') or str(name)
            print(f"  - {name}")
        
        client.close()
        print("Connection test complete")
    
    if __name__ == "__main__":
        print("Running async function...")
        asyncio.run(test_connection())
        print("Script finished successfully")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
