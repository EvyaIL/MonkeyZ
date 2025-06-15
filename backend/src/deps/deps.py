import os
from src.controller.key_controller import KeyController
from src.controller.user_controller import UserController
from src.mongodb.users_collection import UserCollection
from src.mongodb.keys_collection import KeysCollection
from src.controller.product_controller import ProductsController
from src.mongodb.products_collection import ProductsCollection # Use ProductsCollection which has get_product_by_name
from src.mongodb.product_collection import ProductCollection # Add ProductCollection for coupon methods
from src.controller.key_metrics_controller import KeyMetricsController
from src.mongodb.orders_collection import OrdersCollection

def get_user_collection_dependency() -> UserCollection:
    user_collection = UserCollection()
    return user_collection

# This function will provide the ProductsCollection (which has get_product_by_name method)
def get_product_collection_dependency() -> ProductsCollection:
    product_collection = ProductsCollection() # ProductsCollection has the required methods
    # Ensure it's initialized if ProductsCollection has an async init method that needs calling here.
    # However, singletons usually handle their init. If direct init is needed:
    # await product_collection.initialize() # This would make the dependency async
    return product_collection

# This function provides ProductCollection (which has coupon methods)
def get_product_collection_with_coupons_dependency() -> ProductCollection:
    product_collection = ProductCollection()
    return product_collection

def get_keys_collection_dependency() -> KeysCollection:
    keys_collection = KeysCollection()
    return keys_collection

# We can deprecate/remove get_admin_product_collection_dependency if get_product_collection_dependency serves the purpose for shop.Product
# For now, let's keep it but ensure it also returns the shop-configured ProductsCollection or remove its usage.
# To avoid confusion, let's alias it or ensure ProductController uses the main one.

def get_admin_product_collection_dependency() -> ProductsCollection:
    # This should also point to the ProductsCollection as per requirements
    admin_product_collection = ProductsCollection() 
    return admin_product_collection

def get_order_collection_dependency() -> OrdersCollection:
    order_collection = OrdersCollection()
    # Ensure it's initialized if OrdersCollection has an async init method.
    # await order_collection.initialize() # This would make the dependency async
    return order_collection
    
    
def get_user_controller_dependency() -> UserController:
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    # UserController should use ProductCollection which has coupon methods
    shop_product_collection = get_product_collection_with_coupons_dependency() 
    user_controller = UserController(keys_collection, user_collection, shop_product_collection, shop_product_collection)
    return user_controller
    
def get_products_controller_dependency() -> ProductsController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_product_collection_dependency() # Use the unified product collection
    # Pass the same product_collection for both arguments if ProductController expects two but they should be the same source
    product_controller = ProductsController(product_collection, keys_collection, user_collection, product_collection)
    return product_controller
    
    
def get_keys_controller_dependency() -> KeyController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_product_collection_dependency() # Use the unified product collection
    keys_controller = KeyController(product_collection, keys_collection, user_collection)
    return keys_controller

def get_key_metrics_controller_dependency() -> KeyMetricsController:
    # KeyMetricsController should also use the single source of truth for products
    product_collection = get_product_collection_dependency()
    keys_collection = get_keys_collection_dependency()
    key_metrics_controller = KeyMetricsController(product_collection, keys_collection)
    return key_metrics_controller