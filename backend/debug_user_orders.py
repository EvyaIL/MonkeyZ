import asyncio
import sys
sys.path.append('src')
from database import MongoDb

async def debug_user_orders():
    mongo = MongoDb()
    try:
        await mongo.connect()
        db = await mongo.get_db()
        
        target_email = 'mrbrownaffiliate@gmail.com'
        target_coupon = 'test7'
        
        print(f"=== Debugging orders for {target_email} with coupon {target_coupon} ===")
        
        # Get all orders for this user
        all_user_orders = await db.orders.find({
            '$or': [
                {'userEmail': target_email},
                {'email': target_email},
                {'customerEmail': target_email}
            ]
        }).to_list(None)
        
        print(f"Total orders for user: {len(all_user_orders)}")
        
        for i, order in enumerate(all_user_orders):
            print(f"\nOrder {i+1}:")
            print(f"  ID: {order.get('_id')}")
            print(f"  Email: {order.get('email', 'N/A')}")
            print(f"  UserEmail: {order.get('userEmail', 'N/A')}")
            print(f"  CustomerEmail: {order.get('customerEmail', 'N/A')}")
            print(f"  CouponCode: {order.get('couponCode', 'N/A')}")
            print(f"  Status: {order.get('status', 'N/A')}")
            
        # Check for orders with test7 coupon specifically
        coupon_orders = await db.orders.find({
            'couponCode': {'$regex': f'^{target_coupon}$', '$options': 'i'}
        }).to_list(None)
        
        print(f"\n=== All orders with coupon {target_coupon} ===")
        print(f"Total orders with this coupon: {len(coupon_orders)}")
        
        for i, order in enumerate(coupon_orders):
            print(f"\nCoupon Order {i+1}:")
            print(f"  ID: {order.get('_id')}")
            print(f"  Email: {order.get('email', 'N/A')}")
            print(f"  UserEmail: {order.get('userEmail', 'N/A')}")
            print(f"  CustomerEmail: {order.get('customerEmail', 'N/A')}")
            print(f"  CouponCode: {order.get('couponCode', 'N/A')}")
            print(f"  Status: {order.get('status', 'N/A')}")
            
            # Check if this order belongs to our target user
            user_emails = [
                order.get('email', '').lower(),
                order.get('userEmail', '').lower(), 
                order.get('customerEmail', '').lower()
            ]
            if target_email.lower() in user_emails:
                print(f"  *** THIS ORDER BELONGS TO {target_email} ***")
        
        # Test the exact query used by the coupon service
        query = {
            '$or': [
                {'userEmail': target_email},
                {'email': target_email},
                {'customerEmail': target_email}
            ],
            'couponCode': {'$regex': f'^{target_coupon}$', '$options': 'i'},
            'status': {'$nin': ['cancelled', 'failed']}
        }
        
        print(f"\n=== Testing exact coupon service query ===")
        print(f"Query: {query}")
        
        matching_orders = await db.orders.find(query).to_list(None)
        print(f"Orders found by exact query: {len(matching_orders)}")
        
        for i, order in enumerate(matching_orders):
            print(f"\nMatching Order {i+1}:")
            print(f"  ID: {order.get('_id')}")
            print(f"  Email: {order.get('email', 'N/A')}")
            print(f"  UserEmail: {order.get('userEmail', 'N/A')}")
            print(f"  CustomerEmail: {order.get('customerEmail', 'N/A')}")
            print(f"  CouponCode: {order.get('couponCode', 'N/A')}")
            print(f"  Status: {order.get('status', 'N/A')}")
            
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
    finally:
        await mongo.close()

asyncio.run(debug_user_orders())
