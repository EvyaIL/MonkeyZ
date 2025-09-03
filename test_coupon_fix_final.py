#!/usr/bin/env python3
"""
Test the comprehensive coupon fix
"""

import asyncio
import sys
import os
from datetime import datetime, timezone

# Add the backend src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from motor.motor_asyncio import AsyncIOMotorClient
from services.coupon_service import CouponService

async def test_coupon_fix():
    """Test that the coupon fix works correctly"""
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.admin
    
    try:
        # Create test coupon
        await db.coupons.delete_many({"code": "TESTFIX"})
        
        coupon_data = {
            "code": "TESTFIX",
            "discountType": "percentage",
            "discountValue": 10,
            "maxUses": 2,
            "maxUsagePerUser": 1,
            "expirationDate": datetime(2025, 12, 31, tzinfo=timezone.utc),
            "isActive": True,
            "usageCount": 0,
            "createdAt": datetime.now(timezone.utc)
        }
        
        await db.coupons.insert_one(coupon_data)
        print("✅ Test coupon created")
        
        coupon_service = CouponService(db)
        
        # Test 1: Validate should not increment usage
        print("\n🧪 Test 1: Validation should not increment usage")
        initial_count = await coupon_service.get_real_usage_count("TESTFIX")
        print(f"Initial count: {initial_count}")
        
        # Validate multiple times
        for i in range(3):
            discount, coupon, error = await coupon_service.validate_coupon("TESTFIX", 100.0, "test@example.com")
            print(f"Validation {i+1}: discount={discount}, error={error}")
            
        final_count = await coupon_service.get_real_usage_count("TESTFIX")
        print(f"Count after validations: {final_count}")
        
        if initial_count == final_count:
            print("✅ Validation correctly doesn't increment usage")
        else:
            print("❌ Validation incorrectly incremented usage")
            return False
            
        # Test 2: Apply should increment usage
        print("\n🧪 Test 2: Apply should increment usage")
        discount, coupon, error = await coupon_service.apply_coupon("TESTFIX", 100.0, "user1@test.com")
        print(f"Apply result: discount={discount}, error={error}")
        
        if error:
            print(f"❌ Apply failed: {error}")
            return False
            
        count_after_apply = await coupon_service.get_real_usage_count("TESTFIX") 
        print(f"Count after apply: {count_after_apply}")
        
        if count_after_apply == initial_count + 1:
            print("✅ Apply correctly incremented usage")
        else:
            print("❌ Apply didn't increment usage correctly")
            return False
            
        # Test 3: Max usage enforcement
        print("\n🧪 Test 3: Max usage enforcement")
        # Use up remaining usage
        discount, coupon, error = await coupon_service.apply_coupon("TESTFIX", 100.0, "user2@test.com")
        print(f"Second apply: discount={discount}, error={error}")
        
        # This should fail
        discount, coupon, error = await coupon_service.apply_coupon("TESTFIX", 100.0, "user3@test.com")
        print(f"Third apply (should fail): discount={discount}, error={error}")
        
        if error and "usage limit" in error.lower():
            print("✅ Max usage correctly enforced")
            return True
        else:
            print("❌ Max usage not enforced")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        client.close()

async def main():
    print("🚀 Testing Coupon Fix")
    print("=" * 40)
    
    success = await test_coupon_fix()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Coupon fix is working!")
    else:
        print("\n❌ Tests failed. Fix needs more work.")
    
    return success

if __name__ == "__main__":
    asyncio.run(main())
