# Script to normalize all coupon codes in admin.coupons (lowercase and trim)
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"  # Change if needed
DB_NAME = "admin"
COLLECTION_NAME = "coupons"

async def normalize_coupon_codes():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]
    cursor = collection.find({})
    async for coupon in cursor:
        code = coupon.get("code", "")
        normalized = code.strip().lower()
        if code != normalized:
            print(f"Normalizing coupon {coupon.get('_id')}: '{code}' -> '{normalized}'")
            await collection.update_one({"_id": coupon["_id"]}, {"$set": {"code": normalized}})
    print("Done.")
    client.close()

if __name__ == "__main__":
    asyncio.run(normalize_coupon_codes())
