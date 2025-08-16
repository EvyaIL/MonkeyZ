import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def list_admin_coupons():
    """List all coupons in the admin database"""
    
    MONGODB_URI = os.getenv('MONGODB_URI')
    client = AsyncIOMotorClient(MONGODB_URI)
    
    print("=== ADMIN DATABASE COUPONS ===")
    
    try:
        admin_db = client['admin']
        coupons_collection = admin_db['coupons']
        
        # Get all coupons
        cursor = coupons_collection.find({})
        coupons = await cursor.to_list(length=None)
        
        print(f"Found {len(coupons)} coupons:")
        for i, coupon in enumerate(coupons, 1):
            print(f"\n{i}. Coupon ID: {coupon.get('_id')}")
            print(f"   Code: '{coupon.get('code')}' (type: {type(coupon.get('code'))})")
            print(f"   Discount: ${coupon.get('discount', 'N/A')}")
            print(f"   Type: {coupon.get('type', 'N/A')}")
            print(f"   Active: {coupon.get('active', 'N/A')}")
            print(f"   Max Uses: {coupon.get('maxUses', 'N/A')}")
            print(f"   Used Count: {coupon.get('usedCount', 'N/A')}")
            
            # Check expiration
            expires = coupon.get('expiresAt')
            if expires:
                print(f"   Expires: {expires}")
            
        # Test specific coupon lookup (exactly how the service does it)
        print(f"\n=== TESTING COUPON LOOKUP ===")
        for test_code in ['test3', 'test11', 'TEST3', 'TEST11']:
            code = test_code.strip().lower()
            print(f"\nLooking for code: '{code}' (from input: '{test_code}')")
            
            coupon = await coupons_collection.find_one({'code': code, 'active': True})
            if coupon:
                print(f"  ✅ FOUND: {coupon.get('code')} - ${coupon.get('discount')}")
            else:
                print(f"  ❌ NOT FOUND")
                
                # Try without active filter
                coupon_any = await coupons_collection.find_one({'code': code})
                if coupon_any:
                    print(f"     (Found inactive: {coupon_any.get('code')} - active: {coupon_any.get('active')})")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(list_admin_coupons())
