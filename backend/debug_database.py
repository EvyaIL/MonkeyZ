#!/usr/bin/env python3
"""
Debug script to check database and collections
"""
import asyncio
import os
from pymongo import MongoClient

async def debug_database():
    """Debug database connection and collections"""
    try:
        # Get connection details from environment
        mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
        mongo_db_name = os.getenv('MONGO_DATABASE', 'monkeyz')
        
        print(f"Connecting to: {mongo_url}")
        print(f"Database name: {mongo_db_name}")
        
        # Connect with sync client for easier debugging
        client = MongoClient(mongo_url)
        
        # List all databases
        print("\nAvailable databases:")
        for db_name in client.list_database_names():
            print(f"  - {db_name}")
        
        # Check the main database
        db = client[mongo_db_name]
        print(f"\nCollections in '{mongo_db_name}' database:")
        for collection_name in db.list_collection_names():
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")
        
        # Check specifically for coupons
        if 'coupons' in db.list_collection_names():
            print(f"\nCoupons in '{mongo_db_name}.coupons':")
            coupons = list(db.coupons.find().limit(5))
            for coupon in coupons:
                print(f"  - Code: {coupon.get('code')}, Active: {coupon.get('active')}")
        
        # Check if coupons are in other databases
        print("\nSearching for coupons in other databases:")
        for db_name in client.list_database_names():
            if db_name not in ['admin', 'local', 'config']:
                test_db = client[db_name]
                if 'coupons' in test_db.list_collection_names():
                    count = test_db.coupons.count_documents({})
                    print(f"  - Found {count} coupons in {db_name}.coupons")
                    if count > 0:
                        sample_coupons = list(test_db.coupons.find().limit(3))
                        for coupon in sample_coupons:
                            print(f"    * Code: {coupon.get('code')}, Active: {coupon.get('active')}")
        
        client.close()
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_database())
