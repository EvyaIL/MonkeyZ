import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def debug_coupon_locations():
    """Debug exactly where coupons are stored across all databases"""
    
    MONGODB_URI = os.getenv('MONGODB_URI')
    client = AsyncIOMotorClient(MONGODB_URI)
    
    print("=== COMPREHENSIVE COUPON DEBUG ===")
    
    # List all databases
    db_names = await client.list_database_names()
    print(f"Available databases: {db_names}")
    
    # Check each database for coupons collections
    for db_name in db_names:
        if db_name in ['admin', 'config', 'local']:
            continue
            
        print(f"\n--- Database: {db_name} ---")
        db = client[db_name]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
        
        # Check for coupons in various collection names
        coupon_collections = [name for name in collections if 'coupon' in name.lower()]
        if coupon_collections:
            print(f"Coupon-related collections: {coupon_collections}")
        
        # Check common collection names
        for collection_name in ['coupons', 'coupon', 'Coupons']:
            if collection_name in collections:
                collection = db[collection_name]
                count = await collection.count_documents({})
                print(f"  {collection_name}: {count} documents")
                
                if count > 0:
                    # Get sample documents
                    cursor = collection.find({}).limit(3)
                    samples = await cursor.to_list(length=3)
                    print(f"  Sample coupons:")
                    for sample in samples:
                        code = sample.get('code', sample.get('_id', 'NO_CODE'))
                        active = sample.get('active', sample.get('is_active', 'UNKNOWN'))
                        discount = sample.get('discount', sample.get('value', 'UNKNOWN'))
                        print(f"    - {code}: ${discount} (active: {active})")
    
    # Also check the specific databases from our debug
    print(f"\n=== SPECIFIC DATABASE CHECKS ===")
    for db_name in ['shop', 'admin', 'monkeyz']:
        try:
            db = client[db_name]
            coupons_collection = db['coupons']
            count = await coupons_collection.count_documents({})
            print(f"{db_name}.coupons: {count} documents")
            
            if count > 0:
                # Check for our test coupons
                test_coupons = ['test3', 'test11']
                for test_code in test_coupons:
                    coupon = await coupons_collection.find_one({'code': test_code})
                    if coupon:
                        print(f"  Found {test_code}: ${coupon.get('discount', 'N/A')} (active: {coupon.get('active', 'N/A')})")
                    else:
                        # Try case-insensitive
                        coupon = await coupons_collection.find_one({'code': {'$regex': f'^{test_code}$', '$options': 'i'}})
                        if coupon:
                            print(f"  Found {test_code} (case-insensitive): ${coupon.get('discount', 'N/A')} (active: {coupon.get('active', 'N/A')})")
                        else:
                            print(f"  {test_code}: NOT FOUND")
        except Exception as e:
            print(f"{db_name}: Error - {e}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(debug_coupon_locations())
