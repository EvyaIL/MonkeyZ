import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_coupon_fields():
    """Check the exact field structure of coupons"""
    
    MONGODB_URI = os.getenv('MONGODB_URI')
    client = AsyncIOMotorClient(MONGODB_URI)
    
    try:
        admin_db = client['admin']
        coupons_collection = admin_db['coupons']
        
        # Get the test11 coupon to see its structure
        coupon = await coupons_collection.find_one({'code': 'test11'})
        
        if coupon:
            print("=== test11 COUPON STRUCTURE ===")
            for key, value in coupon.items():
                print(f"{key}: {value} (type: {type(value)})")
            
            print(f"\n=== DISCOUNT CALCULATION TEST ===")
            discount_type = coupon.get('discountType', 'percentage')
            discount_value = float(coupon.get('discountValue', 0))
            
            print(f"discountType: {discount_type}")
            print(f"discountValue: {discount_value}")
            
            # Test with amount 100
            original_total = 100
            if discount_type == 'percentage':
                discount_amount = (original_total * discount_value) / 100
            else:
                discount_amount = min(discount_value, original_total)
                
            print(f"For $100 order: discount would be ${discount_amount}")
            
            # Check alternative field names
            print(f"\n=== ALTERNATIVE FIELD CHECK ===")
            alt_fields = ['discount', 'value', 'amount', 'discountAmount', 'percentage']
            for field in alt_fields:
                if field in coupon:
                    print(f"{field}: {coupon[field]}")
        else:
            print("test11 coupon not found")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_coupon_fields())
