import contextlib
from fastapi import APIRouter, Depends, HTTPException
from src.deps.deps import UserCollection,get_keys_controller_dependency, KeysCollection, KeyController
from src.models.key.key import Key, KeyCreateRequest, KeyUpdateRequest, KeyResponse, BulkKeyCreateRequest # Updated import
from src.lib.token_handler import get_current_user
from src.models.user.user import User
from beanie import PydanticObjectId
from src.deps.auth_deps import get_current_admin_user # Import the new admin auth dependency





@contextlib.asynccontextmanager
async def lifespan(router: APIRouter):
   """
   Lifespan context manager for initializing and disconnecting the user controller.

   This context manager handles the lifecycle of the `user_controller` by initializing it
   before yielding control to the FastAPI router and disconnecting it afterward.

   Args:
      router (APIRouter): The FastAPI router to which the lifespan manager is attached.
   """
   key_controller:KeyController = get_keys_controller_dependency()
   await key_controller.initialize()
   yield
   await key_controller.disconnect()
   
key_router = APIRouter(prefix=f"/key",tags=["key"], lifespan=lifespan)

@key_router.post("", response_model=str) # Assuming it returns the key_id as string
async def create_key(key_create_request:KeyCreateRequest,key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   key_id  = await key_controller.create_key(key_create_request, current_user.username)
   return key_id

@key_router.put("/{key_id}", response_model=str) # Added key_id to path, assuming it returns key_id as string
async def edit_key(key_id:PydanticObjectId, key_update_request:KeyUpdateRequest, key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   # Corrected to call update_key method from controller
   updated_key_id = await key_controller.update_key(key_id, key_update_request, current_user.username)
   return updated_key_id



@key_router.get("/product/{product_id}", response_model=list[KeyResponse]) # Changed path for clarity and using KeyResponse
async def get_keys_by_product_route(product_id: PydanticObjectId, start_index:int = 0, max_keys:int = 100, key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   # Assuming get_keys_for_product is the new method in KeysCollection, 
   # and KeyController needs a corresponding method that uses it.
   # For now, let's assume KeyController.get_keys_by_product is updated or calls the correct new method.
   keys = await key_controller.get_keys_by_product(product_id, start_index, max_keys, current_user.username)
   return keys # This should return List[KeyResponse] eventually, controller might need adjustment


@key_router.get("/user", response_model=list[KeyResponse]) # Using KeyResponse
async def get_keys_by_user_route(start_index:int = 0, max_keys:int = 100, key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   keys = await key_controller.get_keys_by_user(start_index, max_keys, current_user.username)
   return keys # This should return List[KeyResponse] eventually, controller might need adjustment

@key_router.get("/{key_id}", response_model=KeyResponse)
async def get_key_by_id_route(key_id: PydanticObjectId, key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
    # Assuming admin/specific user check is handled in controller or by current_user dependency
    key = await key_controller.keys_collection.get_key_by_id(key_id)
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    return key

# Placeholder for new admin routes related to stock management
admin_key_router = APIRouter(prefix=f"/admin/products/{{product_id}}/keys", tags=["admin-keys"], lifespan=lifespan)

@admin_key_router.post("", response_model=list[KeyResponse])
async def admin_add_keys_to_product(
    product_id: PydanticObjectId, 
    bulk_create_request: BulkKeyCreateRequest, 
    key_controller: KeyController = Depends(get_keys_controller_dependency), 
    current_admin_user: User = Depends(get_current_admin_user) # Use the new admin auth dependency
):
    # TODO: Add proper admin role validation dependency for current_admin_user
    # Ensure bulk_create_request.product_id matches product_id from path or handle appropriately
    if bulk_create_request.product_id != product_id:
        raise HTTPException(status_code=400, detail="Product ID in path and body do not match")
    
    created_keys = await key_controller.keys_collection.add_keys_to_product(product_id, bulk_create_request)
    return created_keys

@admin_key_router.get("", response_model=list[KeyResponse])
async def admin_get_keys_for_product(
    product_id: PydanticObjectId, 
    skip: int = 0, 
    limit: int = 100,
    key_controller: KeyController = Depends(get_keys_controller_dependency),
    current_admin_user: User = Depends(get_current_admin_user) # Use the new admin auth dependency
):
    # TODO: Add proper admin role validation dependency
    keys = await key_controller.keys_collection.get_keys_for_product(product_id, skip=skip, limit=limit)
    return keys

# Need to ensure the main app includes this new admin_key_router