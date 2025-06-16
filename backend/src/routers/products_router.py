import contextlib
from fastapi import APIRouter, Depends, HTTPException
from src.models.products.products_response import ProductResponse
from src.deps.deps import ProductsController, get_products_controller_dependency
from src.models.products.products import ProductRequest
from src.lib.token_handler import get_current_user
from src.models.user.user import User
from beanie import PydanticObjectId
from src.models.products.products_exception import NotFound
from src.routers.orders import retry_failed_orders_internal
from src.mongodb.product_collection import ProductCollection
from src.deps.deps import get_product_collection_with_coupons_dependency
from src.mongodb.mongodb import MongoDb



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


product_router = APIRouter(prefix=f"/product",tags=["products"], lifespan=lifespan)


@product_router.get("/all", response_model=list[ProductResponse])
async def get_all_product(products_controller:ProductsController = Depends(get_products_controller_dependency)):
   products = await products_controller.get_all_products() 
   return products


@product_router.get("/best-sellers", response_model=list[ProductResponse])
async def get_best_sellers(products_controller:ProductsController = Depends(get_products_controller_dependency)):
   products = await products_controller.product_collection.get_best_sellers() 
   return products

@product_router.get("/recent", response_model=list[ProductResponse])
async def get_best_sellers(limit:int = 8, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   products = await products_controller.get_recent_products(limit=limit) 
   return products


@product_router.get("", response_model=ProductResponse)
async def get_product(product_id:PydanticObjectId, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   product = await products_controller.product_collection.get_product_by_id(product_id) 
   if not product:
      raise HTTPException(status_code=404, detail=f"Product with id {product_id} not found")
   return product


# @product_router.get("/name/{product_name}", response_model=ProductResponse) # Keep this commented or remove
# async def get_product_by_name_endpoint(product_name:str, products_controller:ProductsController = Depends(get_products_controller_dependency)):
#    # Use the existing get_product_by_name method from the collection
#    # This method already handles case-insensitivity and multi-language names
#    try:
#       product = await products_controller.product_collection.get_product_by_name(product_name)
#    except NotFound:
#       # products_controller.product_collection.get_product_by_name raises NotFound if no product is found
#       raise HTTPException(status_code=404, detail=f"Product with name {product_name} not found")
#    
#    if not product: # Should be redundant due to the try-except but as a safeguard
#       raise HTTPException(status_code=404, detail=f"Product with name {product_name} not found")
#    return product

@product_router.get("/homepage", response_model=list[ProductResponse])
async def get_homepage_products(limit:int = 6, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   products = await products_controller.get_homepage_products(limit=limit)
   return products

# Make this the primary route for fetching by name, replacing the slug-based one or the /name/ one.
@product_router.get("/{product_identifier}", response_model=ProductResponse)
async def get_product_by_name_or_slug_endpoint(product_identifier:str, products_controller:ProductsController = Depends(get_products_controller_dependency)):
   product = None
   # Try fetching by slug first if you have a clear distinction or expect slugs often
   # For now, as per preference for name, let's prioritize name, or make it more robust.
   # Assuming product_identifier can be a name.
   try:
      product = await products_controller.product_collection.get_product_by_name(product_identifier)
      if product:
         return product
   except NotFound:
      pass # Will try by slug or raise 404 later

   # If not found by name, try by slug (if you still want to support slugs)
   # This part can be removed if slugs are fully deprecated for direct URL access
   if not product:
       try:
           product = await products_controller.product_collection.get_product_by_slug(product_identifier)
           if product:
               return product
       except NotFound:
           pass # Will raise 404

   if not product:
      raise HTTPException(status_code=404, detail=f"Product with identifier '{product_identifier}' not found")
   return product


# Comment out or remove the old slug-specific endpoint if it's fully replaced by the one above.
# @product_router.get("/{product_slug}", response_model=ProductResponse)
# async def get_product_by_slug_endpoint(product_slug:str, products_controller:ProductsController = Depends(get_products_controller_dependency)):
#    product = await products_controller.product_collection.get_product_by_slug(product_slug) 
#    if not product:
#       # Try to find by name if slug is not found, assuming slug might be a name
#       try:
#          product = await products_controller.product_collection.get_product_by_name(product_slug)
#       except NotFound:
#          raise HTTPException(status_code=404, detail=f"Product with slug or name '{product_slug}' not found")
#       if not product:
#           raise HTTPException(status_code=404, detail=f"Product with slug or name '{product_slug}' not found")
#    return product


@product_router.put("")
async def edit_product(product_id:PydanticObjectId, product_request:ProductRequest,products_controller:ProductsController = Depends(get_products_controller_dependency), current_user:User = Depends(get_current_user)):
   product_id = await products_controller.edit_product(product_id,product_request,current_user.username)
   return product_id

@product_router.delete("")
async def delete_product(product_id:PydanticObjectId, products_controller:ProductsController = Depends(get_products_controller_dependency), current_user:User = Depends(get_current_user)):
   product_id = await products_controller.delete_product(product_id,current_user.username)
   return product_id

@product_router.post("/add-keys", response_model=ProductResponse)
async def add_keys_to_product(
    product_id: PydanticObjectId,
    keys: list[str],
    products_controller: ProductsController = Depends(get_products_controller_dependency),
    current_user: User = Depends(get_current_user)
):
    """
    Add new CD keys to a product and auto-fulfill any 'AWAITING STOCK' orders.
    """
    # Add keys to the product
    product = await products_controller.product_collection.add_keys_to_product(product_id, keys)

    # Trigger retry for failed/awaiting stock orders
    db = await MongoDb().get_db()
    product_collection = ProductCollection()
    await retry_failed_orders_internal(db, product_collection)

    return product