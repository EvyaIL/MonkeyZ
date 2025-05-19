import os

from src.mongodb.image_collection import ImageCollection
from src.mongodb.sales_collection import SalesCollection
from src.mongodb.users_collection import UserCollection
from src.mongodb.products_collection import ProductsCollection
from src.mongodb.keys_collection import KeysCollection

from src.controller.product_controller import ProductsController
from src.controller.sales_controller import SalesController
from src.controller.key_controller import KeyController
from src.controller.user_controller import UserController

def get_user_collection_dependency() -> UserCollection:
    user_collection = UserCollection()
    return user_collection

def get_products_collection_dependency() -> ProductsCollection:
    products_collection = ProductsCollection()
    return products_collection

def get_keys_collection_dependency() -> KeysCollection:
    keys_collection = KeysCollection()
    return keys_collection

def get_sales_collection_dependency() -> KeysCollection:
    sales_collection = SalesCollection()
    return sales_collection 

def get_images_collection_dependency() -> ImageCollection:
    images_collection = ImageCollection()
    return images_collection
    
def get_user_controller_dependency() -> UserController:
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    user_controller = UserController(keys_collection, user_collection)
    return user_controller
    
def get_products_controller_dependency() -> ProductsController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_products_collection_dependency()
    image_collection = get_images_collection_dependency()

    product_controller = ProductsController(product_collection, keys_collection, user_collection, image_collection)
    return product_controller
    
    
def get_keys_controller_dependency() -> KeyController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_products_collection_dependency()
    keys_controller = KeyController(product_collection, keys_collection, user_collection)
    return keys_controller


def get_sales_controller_dependency() -> KeyController: 
    keys_collection = get_keys_collection_dependency()
    user_collection = get_user_collection_dependency()
    product_collection = get_products_collection_dependency()
    sales_collection = get_sales_collection_dependency()

    keys_controller = SalesController(product_collection, keys_collection, user_collection, sales_collection)
    return keys_controller