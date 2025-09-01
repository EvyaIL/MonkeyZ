import asyncio
import sys
sys.path.append('src')
from database import MongoDb

async def check_orders_and_coupons():
    mongo = MongoDb()
    try:
        await mongo.connect()
        db = await mongo.get_db()
        admin_db = mongo.client['admin']
        
        # Check orders for coupon usage
        orders = await db.orders.find({}).to_list(None)
        print(f'Total orders: {len(orders)}')
        
        coupon_orders = [o for o in orders if o.get('couponCode')]
        print(f'Orders with coupons: {len(coupon_orders)}')
        
        for order in coupon_orders[:5]:
            email = order.get('email', order.get('customerEmail', order.get('userEmail')))
            print(f'  Order: {order.get("_id")} - Coupon: {order.get("couponCode")} - Email: {email} - Status: {order.get("status")}')
        
        # Check coupon in admin db
        coupons = await admin_db.coupons.find({}).to_list(None)
        print(f'\nTotal coupons: {len(coupons)}')
        
        for coupon in coupons[:5]:
            print(f'  Coupon: {coupon.get("code")} - MaxPerUser: {coupon.get("maxUsagePerUser")} - Active: {coupon.get("active")}')
            
        # Test specific coupon validation for a user
        print('\n--- Testing per-user validation ---')
        test_email = 'test@example.com'
        test_coupon = 'test3'
        
        # Check if this coupon exists and has per-user limits
        test_coupon_obj = await admin_db.coupons.find_one({'code': test_coupon, 'active': True})
        if test_coupon_obj:
            max_per_user = test_coupon_obj.get('maxUsagePerUser', 0)
            print(f'Coupon {test_coupon} - MaxUsagePerUser: {max_per_user}')
            
            if max_per_user > 0:
                # Count usage for this user
                user_usage = await db.orders.count_documents({
                    '$or': [
                        {'userEmail': test_email},
                        {'email': test_email},
                        {'customerEmail': test_email}
                    ],
                    'couponCode': {'$regex': f'^{test_coupon}$', '$options': 'i'},
                    'status': {'$nin': ['cancelled', 'failed']}
                })
                print(f'User {test_email} has used coupon {test_coupon} {user_usage} times (limit: {max_per_user})')
                
                if user_usage >= max_per_user:
                    print('❌ Should show error: User has reached limit')
                else:
                    print('✅ Should allow: User under limit')
            else:
                print('No per-user limit set for this coupon')
        else:
            print(f'Coupon {test_coupon} not found or not active')
            
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
    finally:
        await mongo.close()

asyncio.run(check_orders_and_coupons())
