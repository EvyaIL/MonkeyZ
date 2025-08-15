import asyncio
from pymongo import MongoClient
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def check_coupons():
    try:
        # Use environment variables directly for MongoDB connection
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        mongo_db = os.getenv('MONGO_DB', 'monkeyz')
        
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # Get a few sample coupons
        coupons = list(db.coupons.find().limit(5))
        print('Sample coupons in database:')
        for coupon in coupons:
            print(f'Code: {coupon.get("code")}, UsageCount: {coupon.get("usageCount", 0)}, MaxUses: {coupon.get("maxUses")}, MaxUsagePerUser: {coupon.get("maxUsagePerUser")}')
            print(f'UserUsages: {coupon.get("userUsages", {})}')
            print(f'UsageAnalytics: {coupon.get("usageAnalytics", {})}')
            print('---')
            
        # Also check some orders with coupons
        orders = list(db.orders.find({'$or': [{'couponCode': {'$exists': True}}, {'coupon_code': {'$exists': True}}]}).limit(5))
        print('\nSample orders with coupons:')
        for order in orders:
            print(f'Order ID: {order.get("_id")}, Coupon: {order.get("couponCode") or order.get("coupon_code")}, Status: {order.get("status")}, Email: {order.get("email")}')
        
        client.close()
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(check_coupons())
