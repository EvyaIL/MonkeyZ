# filepath: c:\Users\User\OneDrive\????? ??????\??????\GitHub\nin1\MonkeyZ\backend\src\routers\products_router.py
import contextlib
from fastapi import APIRouter, Depends
from src.models.products.products_response import ProductResponse
from src.deps.deps import ProductsController, get_products_controller_dependency
from src.models.products.products import ProductRequest
from src.lib.token_handler import get_current_user
from src.models.user.user import User
from beanie import PydanticObjectId



@contextlib.asynccontextmanager
async def lifespan(router: APIRouter):
   """
   Lifespan context manager for initializing and disconnecting the user controller.

   This context manager handles the lifecycle of the `user_controller` by initializing it
   before yielding control to the FastAPI router and disconnecting it afterward.

   Args:
      router (APIRouter): The FastAPI router to which the lifespan manager is attached.
   """
   product_controller:ProductsController = get_products_controller_dependency()
   await product_controller.initialize()
   yield
   await product_controller.disconnect()


product_router = APIRouter(prefix=f"/product", tags=["products"], lifespan=lifespan)


@product_router.get("/all", response_model=list[ProductResponse])
async def get_all_product(products_controller:ProductsController = Depends(get_products_controller_dependency)):
   """Gets all products"""
   try:
      products = await products_controller.product_collection.get_all_products()
      return products
   except Exception as e:
      print(f"Error in get_all_product endpoint: {str(e)}")
      # Return empty list instead of raising exception
      return []


@product_router.get("/homepage", response_model=list[ProductResponse])
async def get_homepage_products(limit:int = 6, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   """
   Get products marked for display on the homepage.
   
   Args:
       limit (int): Maximum number of homepage products to return.
       products_controller (ProductsController): Injected product controller.
       
   Returns:
       list[ProductResponse]: List of products marked for homepage display.
   """
   try:
      products = await products_controller.get_homepage_products(limit=limit)
      return products
   except Exception as e:
      print(f"Error in get_homepage_products endpoint: {str(e)}")
      # Return empty list instead of raising exception
      return []


@product_router.get("/best-sellers", response_model=list[ProductResponse])
async def get_best_sellers(products_controller:ProductsController = Depends(get_products_controller_dependency)):
   """Gets best seller products"""
   try:
      products = await products_controller.get_best_sellers()
      return products
   except Exception as e:
      print(f"Error in get_best_sellers endpoint: {str(e)}")
      # Return empty list instead of raising exception
      return []


@product_router.get("/recent", response_model=list[ProductResponse])
async def get_recent_products(limit:int = 8, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   """Gets recent products with optional limit"""
   try:
      products = await products_controller.get_recent_products(limit=limit)
      return products
   except Exception as e:
      print(f"Error in get_recent_products endpoint: {str(e)}")
      # Return empty list instead of raising exception
      return []


@product_router.get("", response_model=ProductResponse)
async def get_product_by_id(product_id:PydanticObjectId, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   """Gets a product by ID"""
   products = await products_controller.product_collection.get_product_by_id(product_id) 
   return products


@product_router.get("/{name_product}", response_model=ProductResponse)
async def get_product_by_name(name_product:str, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   """Gets a product by name"""
   products = await products_controller.product_collection.get_product_by_name(name_product) 
   return products


@product_router.put("")
async def edit_product(product_id:PydanticObjectId, product_request:ProductRequest, products_controller:ProductsController = Depends(get_products_controller_dependency), current_user:User = Depends(get_current_user)):
   """Edits a product"""
   product_id = await products_controller.edit_product(product_id, product_request, current_user.username)
   return product_id


@product_router.delete("")
async def delete_product(product_id:PydanticObjectId, products_controller:ProductsController = Depends(get_products_controller_dependency), current_user:User = Depends(get_current_user)):
   """Deletes a product"""
   product_id = await products_controller.delete_product(product_id, current_user.username)
   return product_id
