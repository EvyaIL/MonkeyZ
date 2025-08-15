#!/usr/bin/env python3
"""
Script to test coupon validation manually
"""
import asyncio
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_coupon_validation():
    """Test coupon validation manually"""
    try:
        from src.mongodb.mongodb import MongoDb
        from src.services.coupon_service import CouponService

        # Initialize database
        mongodb = MongoDb()
        await mongodb.connection()
        db = await mongodb.get_db()
        
        # Initialize coupon service
        coupon_service = CouponService(db)
        
        # Test coupon codes from the logs
        test_cases = [
            {
                'code': 'test3',
                'amount': 100.0,
                'email': 'mrbrownaffiliate@gmail.com',
                'description': 'User who has used test3 coupon 3 times'
            },
            {
                'code': 'family50',
                'amount': 100.0,
                'email': 'evyatarhypixel1477@gmail.com',
                'description': 'User who has used family50 coupon'
            },
            {
                'code': 'test3',
                'amount': 100.0,
                'email': 'newuser@example.com',
                'description': 'New user trying test3 coupon'
            }
        ]
        
        print("=" * 80)
        print("COUPON VALIDATION TEST")
        print("=" * 80)
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nTest Case {i}: {test_case['description']}")
            print(f"Code: {test_case['code']}, Amount: {test_case['amount']}, Email: {test_case['email']}")
            print("-" * 40)
            
            # Test validation
            discount, coupon_obj, error = await coupon_service.validate_coupon(
                test_case['code'], 
                test_case['amount'], 
                test_case['email']
            )
            
            if error:
                print(f"❌ VALIDATION FAILED: {error}")
            else:
                print(f"✅ VALIDATION SUCCESSFUL: Discount = {discount}")
                if coupon_obj:
                    print(f"   Coupon Details:")
                    print(f"   - Max Uses: {coupon_obj.get('maxUses', 'Unlimited')}")
                    print(f"   - Max Usage Per User: {coupon_obj.get('maxUsagePerUser', 'Unlimited')}")
                    print(f"   - Current Usage Count: {coupon_obj.get('usageCount', 0)}")
                    print(f"   - User Usages: {coupon_obj.get('userUsages', {})}")
            
            print("-" * 40)
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_coupon_validation())
