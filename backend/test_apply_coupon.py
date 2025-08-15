import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_apply_coupon():
    """Test the apply_coupon method to see if it increments usage"""
    try:
        from src.mongodb.mongodb import MongoDb
        from src.services.coupon_service import CouponService

        # Initialize database connection
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient('mongodb://localhost:27017/')
        db = client['shop']  # Use main database, service will find admin internally

        # Initialize coupon service
        coupon_service = CouponService(db)
        
        print("=== TESTING APPLY_COUPON METHOD ===")
        
        # Test apply_coupon (this should increment usage count)
        discount, coupon, error = await coupon_service.apply_coupon(
            "test6", 100, "brownmaster555@gmail.com"
        )
        
        if error:
            print(f"❌ Apply coupon failed: {error}")
        else:
            print(f"✅ Apply coupon succeeded!")
            print(f"   💰 Discount: ${discount}")
            print(f"   📊 Coupon ID: {coupon.get('_id') if coupon else 'None'}")
            
        # Now check the usage count
        print("\n=== CHECKING USAGE COUNT AFTER APPLY ===")
        admin_db = db.client.get_database("admin")
        updated_coupon = await admin_db.coupons.find_one({"code": "test6"})
        
        if updated_coupon:
            usage_count = updated_coupon.get('usageCount', 0)
            print(f"✅ Updated usage count: {usage_count}")
            if usage_count > 0:
                print("🎉 SUCCESS: Usage count incremented!")
            else:
                print("❌ FAILURE: Usage count not incremented!")
        else:
            print("❌ FAILURE: Coupon not found after apply!")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_apply_coupon())
