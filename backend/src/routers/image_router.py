import contextlib
from fastapi import APIRouter, Depends
from src.models.products.products_response import ProductResponse
from src.deps.deps import ProductsController, get_products_controller_dependency
from src.models.products.products import ProductRequest
from src.lib.token_handler import get_current_user
from src.models.user.user import User
from beanie import PydanticObjectId
from src.models.images.image import Image, ImageRequest



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


image_router = APIRouter(prefix=f"/image",tags=["images"], lifespan=lifespan)


@image_router.post("/many", response_model=list[ImageRequest| None])
async def get_all_product(ids: list[PydanticObjectId], products_controller:ProductsController = Depends(get_products_controller_dependency)):
    images = []
    for id in ids:
        images.append(await products_controller.image_collection.get_image(id))
    return images
