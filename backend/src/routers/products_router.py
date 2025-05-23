import contextlib
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from src.models.products.product_schema import ProductResponse, ProductCreate, ProductUpdate
from src.deps.deps import get_products_controller_dependency, ProductsController
from src.models.user.user import User
from src.lib.token_handler import get_current_user
from datetime import datetime
from src.models.products.products_exception import DeleteError
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

product_router = APIRouter(prefix="/product", tags=["products"], lifespan=lifespan)

@product_router.get("/all", response_model=List[ProductResponse])
async def get_all_products(
    products_controller: ProductsController = Depends(get_products_controller_dependency),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|price|name)$"),
    sort_order: int = Query(-1, ge=-1, le=1)
):
    """Get all products with optional filtering and sorting"""
    try:
        products = await products_controller.product_collection.search_products(
            query=search,
            category=category,
            min_price=min_price,
            max_price=max_price,
            sort_by=sort_by,
            sort_order=sort_order
        )
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/best-sellers", response_model=List[ProductResponse])
async def get_best_sellers(
    limit: int = Query(5, ge=1, le=20),
    products_controller: ProductsController = Depends(get_products_controller_dependency)
):
    """Get best selling products"""
    try:
        products = await products_controller.product_collection.get_best_sellers(limit=limit)
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/recent", response_model=List[ProductResponse])
async def get_recent_products(
    limit: int = Query(8, ge=1, le=20),
    products_controller: ProductsController = Depends(get_products_controller_dependency)
):
    """Get recently added products"""
    try:
        products = await products_controller.product_collection.get_recent_products(limit=limit)
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/{product_id}", response_model=ProductResponse)
async def get_product_by_id(
    product_id: str,
    products_controller: ProductsController = Depends(get_products_controller_dependency)
):
    """Get a product by ID"""
    try:
        product = await products_controller.product_collection.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.get("/by-name/{name}", response_model=ProductResponse)
async def get_product_by_name(
    name: str,
    products_controller: ProductsController = Depends(get_products_controller_dependency)
):
    """Get a product by name"""
    try:
        product = await products_controller.product_collection.get_product_by_name(name)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.post("/", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    products_controller: ProductsController = Depends(get_products_controller_dependency),
    current_user: User = Depends(get_current_user)
):
    """Create a new product (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        return await products_controller.product_collection.create_product(product)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    products_controller: ProductsController = Depends(get_products_controller_dependency),
    current_user: User = Depends(get_current_user)
):
    """Update a product (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        product = await products_controller.product_collection.update_product(product_id, product_update)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@product_router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    products_controller: ProductsController = Depends(get_products_controller_dependency),
    current_user: User = Depends(get_current_user)
):
    """Delete a product (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    try:
        success = await products_controller.product_collection.delete_product(product_id)
        if not success:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except DeleteError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))