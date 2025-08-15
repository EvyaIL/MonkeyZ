import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_dbs():
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db_names = await client.list_database_names()
    print(f'All databases: {db_names}')
    
    for db_name in db_names:
        if db_name not in ['local', 'config']:
            try:
                db = client[db_name]
                coupon_count = await db.coupons.count_documents({})
                print(f'Coupons in {db_name}: {coupon_count}')
                if coupon_count > 0:
                    sample = await db.coupons.find_one({})
                    print(f'  Sample coupon: {sample.get("code") if sample else "None"}')
            except Exception as e:
                print(f'Error checking {db_name}: {e}')

asyncio.run(check_all_dbs())
