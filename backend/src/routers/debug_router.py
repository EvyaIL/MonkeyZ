from fastapi import APIRouter
import logging
import os

logger = logging.getLogger(__name__)

debug_router = APIRouter()

@debug_router.get("/debug/environment")
async def debug_environment():
    """
    Debug endpoint to check environment differences between localhost and DigitalOcean
    """
    try:
        from ..deps.deps import get_user_controller_dependency
        user_controller = get_user_controller_dependency()
        
        # Ensure the product collection is properly initialized
        if not hasattr(user_controller.product_collection, 'db') or user_controller.product_collection.db is None:
            await user_controller.product_collection.initialize()
            
        main_db = user_controller.product_collection.db
        client = user_controller.product_collection.client
        
        # Check different databases
        databases_info = {}
        
        # Check current database
        current_db_name = main_db.name
        databases_info['current_db'] = {
            'name': current_db_name,
            'orders_count': await main_db.orders.count_documents({}),
            'coupons_count': await main_db.coupons.count_documents({}) if 'coupons' in await main_db.list_collection_names() else 0
        }
        
        # Check admin database
        admin_db = client.get_database("admin")
        databases_info['admin_db'] = {
            'name': 'admin',
            'orders_count': await admin_db.orders.count_documents({}) if 'orders' in await admin_db.list_collection_names() else 0,
            'coupons_count': await admin_db.coupons.count_documents({}) if 'coupons' in await admin_db.list_collection_names() else 0
        }
        
        # Check monkeyz database
        try:
            monkeyz_db = client.get_database("monkeyz")
            databases_info['monkeyz_db'] = {
                'name': 'monkeyz',
                'orders_count': await monkeyz_db.orders.count_documents({}) if 'orders' in await monkeyz_db.list_collection_names() else 0,
                'coupons_count': await monkeyz_db.coupons.count_documents({}) if 'coupons' in await monkeyz_db.list_collection_names() else 0
            }
        except Exception:
            databases_info['monkeyz_db'] = {'error': 'Cannot access monkeyz database'}
        
        # Environment variables
        env_info = {
            'NODE_ENV': os.getenv('NODE_ENV', 'NOT SET'),
            'ENVIRONMENT': os.getenv('ENVIRONMENT', 'NOT SET'), 
            'PAYPAL_MODE': os.getenv('PAYPAL_MODE', 'NOT SET'),
            'MONGODB_URI_starts_with': os.getenv('MONGODB_URI', 'NOT SET')[:50],
        }
        
        # Sample coupon usage check
        coupon_sample = {}
        for db_name, db_info in databases_info.items():
            if db_info.get('orders_count', 0) > 0:
                try:
                    db = client.get_database(db_info['name'])
                    # Get a sample order with coupon
                    sample_order = await db.orders.find_one({'couponCode': {'$exists': True, '$ne': None, '$ne': ''}})
                    if sample_order:
                        coupon_code = sample_order.get('couponCode')
                        count = await db.orders.count_documents({
                            'couponCode': {'$regex': f'^{coupon_code}$', '$options': 'i'},
                            'status': {'$nin': ['cancelled', 'failed']}
                        })
                        coupon_sample[db_name] = {
                            'sample_coupon': coupon_code,
                            'usage_count': count
                        }
                except Exception as e:
                    coupon_sample[db_name] = {'error': str(e)}
        
        return {
            'environment': env_info,
            'databases': databases_info,
            'coupon_usage_sample': coupon_sample,
            'total_databases_checked': len(databases_info)
        }
        
    except Exception as e:
        logger.error(f"Debug environment error: {e}")
        return {'error': str(e)}
