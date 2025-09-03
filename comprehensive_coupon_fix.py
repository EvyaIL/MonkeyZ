# Comprehensive Coupon System Fix
import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComprehensiveCouponFix:
    def __init__(self):
        # Connect to the same database the backend uses
        mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.main_db = self.client.MonkeyZ
        self.admin_db = self.client.admin
        
    async def setup_test_coupons(self):
        """Create test coupons for debugging"""
        print("🛠️  Setting up test coupons...")
        
        coupons_collection = self.admin_db.coupons
        
        test_coupons = [
            {
                "code": "TEST10",
                "discountType": "percentage",
                "discountValue": 10,
                "maxUses": 2,
                "maxUsagePerUser": 1,
                "usageCount": 0,
                "userUsages": {},
                "active": True,
                "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
                "createdAt": datetime.now(timezone.utc),
                "description": "Test: 10% off, 2 max total, 1 per user"
            },
            {
                "code": "SAVE20", 
                "discountType": "fixed",
                "discountValue": 20,
                "maxUses": 5,
                "maxUsagePerUser": 2,
                "usageCount": 0,
                "userUsages": {},
                "active": True,
                "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
                "createdAt": datetime.now(timezone.utc),
                "description": "Test: $20 off, 5 max total, 2 per user"
            }
        ]
        
        for coupon in test_coupons:
            await coupons_collection.replace_one(
                {"code": coupon["code"]}, 
                coupon, 
                upsert=True
            )
            print(f"✅ Created/Updated {coupon['code']}")
        
        return len(test_coupons)
    
    async def analyze_current_state(self):
        """Analyze the current state of coupons and orders"""
        print("\n📊 Analyzing Current State...")
        
        # Check coupons
        coupons_count = await self.admin_db.coupons.count_documents({})
        print(f"Coupons in admin.coupons: {coupons_count}")
        
        # Check orders
        orders_count = await self.main_db.orders.count_documents({})
        print(f"Orders in MonkeyZ.orders: {orders_count}")
        
        # Check orders with coupons
        coupon_orders = await self.main_db.orders.count_documents({
            "$or": [
                {"couponCode": {"$exists": True, "$ne": None, "$ne": ""}},
                {"coupon_code": {"$exists": True, "$ne": None, "$ne": ""}}
            ]
        })
        print(f"Orders with coupons: {coupon_orders}")
        
        return {
            "coupons": coupons_count,
            "orders": orders_count,
            "coupon_orders": coupon_orders
        }
    
    async def test_coupon_validation(self, coupon_code, test_email, amount=100):
        """Test coupon validation logic"""
        print(f"\n🧪 Testing {coupon_code} with {test_email}...")
        
        # Get coupon
        coupon = await self.admin_db.coupons.find_one({
            'code': {'$regex': f'^{coupon_code}$', '$options': 'i'}, 
            'active': True
        })
        
        if not coupon:
            print(f"❌ Coupon {coupon_code} not found")
            return False
        
        print(f"✅ Found coupon: {coupon.get('description', 'No description')}")
        print(f"   MaxUses: {coupon.get('maxUses')}, MaxUsagePerUser: {coupon.get('maxUsagePerUser')}")
        
        # Check overall usage
        orders_with_coupon = await self.main_db.orders.count_documents({
            '$and': [
                {
                    '$or': [
                        {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                        {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                    ]
                },
                {
                    'status': {'$nin': ['cancelled', 'failed']}
                }
            ]
        })
        
        print(f"   Current overall usage: {orders_with_coupon}")
        
        # Check per-user usage
        user_orders = await self.main_db.orders.count_documents({
            '$and': [
                {
                    '$or': [
                        {'userEmail': {'$regex': f'^{test_email}$', '$options': 'i'}},
                        {'email': {'$regex': f'^{test_email}$', '$options': 'i'}},
                        {'customerEmail': {'$regex': f'^{test_email}$', '$options': 'i'}}
                    ]
                },
                {
                    '$or': [
                        {'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'}},
                        {'coupon_code': {'$regex': f'^{coupon_code}$', '$options': 'i'}}
                    ]
                },
                {
                    'status': {'$nin': ['cancelled', 'failed']}
                }
            ]
        })
        
        print(f"   User {test_email} usage: {user_orders}")
        
        # Validation logic
        max_uses = coupon.get('maxUses', 0)
        max_usage_per_user = coupon.get('maxUsagePerUser', 0)
        
        overall_valid = (max_uses == 0) or (orders_with_coupon < max_uses)
        user_valid = (max_usage_per_user == 0) or (user_orders < max_usage_per_user)
        
        print(f"   Overall limit check: {'PASS' if overall_valid else 'FAIL'}")
        print(f"   Per-user limit check: {'PASS' if user_valid else 'FAIL'}")
        
        is_valid = overall_valid and user_valid
        print(f"   Final result: {'VALID' if is_valid else 'INVALID'}")
        
        return is_valid
    
    async def run_comprehensive_test(self):
        """Run a comprehensive test of the coupon system"""
        print("🔧 Comprehensive Coupon System Test\n")
        
        # Setup test coupons
        await self.setup_test_coupons()
        
        # Analyze state
        state = await self.analyze_current_state()
        
        # Test scenarios
        test_scenarios = [
            ("TEST10", "user1@test.com"),
            ("TEST10", "user2@test.com"),
            ("TEST10", "user1@test.com"),  # Should fail - user1 already used
            ("SAVE20", "user1@test.com"),
            ("SAVE20", "user2@test.com"),
            ("NONEXISTENT", "user1@test.com"),  # Should fail - doesn't exist
        ]
        
        for coupon_code, email in test_scenarios:
            await self.test_coupon_validation(coupon_code, email)
        
        self.client.close()
        
        print("\n🎯 Test Complete!")
        print("If you see issues, check the coupon_service.py validation logic.")

async def main():
    fixer = ComprehensiveCouponFix()
    await fixer.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
