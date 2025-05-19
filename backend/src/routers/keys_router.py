import contextlib
from fastapi import APIRouter, Depends
from src.deps.deps import UserCollection,get_keys_controller_dependency, KeysCollection, KeyController
from src.models.key.key import Key, KeyRequest
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
   key_controller:KeyController = get_keys_controller_dependency()
   await key_controller.initialize()
   yield
   await key_controller.disconnect()
   
key_router = APIRouter(prefix=f"/key",tags=["key"], lifespan=lifespan)

@key_router.post("")
async def create_key(key_request:KeyRequest,key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   key_id  =await key_controller.create_key(key_request, current_user.username)
   return key_id

@key_router.put("")
async def edit_key(key_id:PydanticObjectId,key_request:KeyRequest,key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   key_id = await key_controller.create_key(key_id,key_request, current_user.username)
   return key_id



@key_router.get("by_product", response_model=list[Key])
async def get_keys_by_product(product_id: PydanticObjectId, start_index:int, max_keys:int, key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   keys = await key_controller.get_keys_by_product(product_id, start_index, max_keys, current_user.username)
   return keys


@key_router.get("by_user", response_model=list[Key])
async def get_keys_by_product(start_index:int, max_keys:int, key_controller:KeyController = Depends(get_keys_controller_dependency), current_user:User = Depends(get_current_user)):
   keys = await key_controller.get_keys_by_user(start_index, max_keys, current_user.username)
   return keys