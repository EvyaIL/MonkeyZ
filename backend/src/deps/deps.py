import os
from src.controller.key_controller import KeyController
from src.controller.user_controller import UserController
from src.mongodb.users_collection import UserCollection
from src.mongodb.products_collection import ProductsCollection
from src.mongodb.keys_collection import KeysCollection
from src.controller.product_controller import ProductsController
from src.mongodb.product_collection import ProductCollection

def get_user_collection_dependency() -> UserCollection:
    user_collection = UserCollection()
    return user_collection


def get_products_collection_dependency() -> ProductsCollection:
    products_collection = ProductsCollection()
    return products_collection

def get_keys_collection_dependency() -> KeysCollection:
    keys_collection = KeysCollection()
    return keys_collection

def get_admin_product_collection_dependency() -> ProductCollection:
    admin_product_collection = ProductCollection()
    return admin_product_collection
    
    
def get_user_controller_dependency() -> UserController:
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    admin_product_collection = get_admin_product_collection_dependency()
    user_controller = UserController(keys_collection, user_collection, admin_product_collection)
    return user_controller
    
def get_products_controller_dependency() -> ProductsController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_products_collection_dependency()
    admin_product_collection = get_admin_product_collection_dependency()
    product_controller = ProductsController(product_collection, keys_collection, user_collection, admin_product_collection)
    return product_controller
    
    
def get_keys_controller_dependency() -> KeyController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_products_collection_dependency()
    keys_controller = KeyController(product_collection, keys_collection, user_collection)
    return keys_controller