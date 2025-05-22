from fastapi import APIRouter, Depends, HTTPException
from src.models.user.user import Role
from src.deps.deps import UserController, get_user_controller_dependency
from src.lib.token_handler import get_current_user
from src.models.token.token import TokenData
from src.models.user.user_exception import UserException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    imageUrl: str
    active: bool = True

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

class CouponBase(BaseModel):
    code: str
    discountPercent: float
    active: bool = True
    expiresAt: datetime

class CouponCreate(CouponBase):
    pass

class Coupon(CouponBase):
    id: str
    createdAt: datetime

admin_router = APIRouter(prefix="/admin", tags=["admin"])

async def verify_admin(user_controller: UserController, current_user: TokenData):
    """Verify that the current user has admin privileges."""
    try:
        user = await user_controller.user_collection.get_user_by_username(current_user.username)
        if user.role != Role.manager:
            raise HTTPException(status_code=403, detail="Admin privileges required")
        return user
    except UserException as e:
        raise HTTPException(status_code=403, detail=str(e))

# Product routes
@admin_router.get("/products", response_model=List[Product])
async def get_products(
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    products = await user_controller.product_collection.get_all_products()
    return products

@admin_router.post("/products", response_model=Product)
async def create_product(
    product: ProductCreate,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    new_product = await user_controller.product_collection.create_product(product)
    return new_product

@admin_router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product: ProductBase,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    updated_product = await user_controller.product_collection.update_product(product_id, product)
    return updated_product

@admin_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    await user_controller.product_collection.delete_product(product_id)
    return {"message": "Product deleted successfully"}

# Coupon routes
@admin_router.get("/coupons", response_model=List[Coupon])
async def get_coupons(
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    coupons = await user_controller.product_collection.get_all_coupons()
    return coupons

@admin_router.post("/coupons", response_model=Coupon)
async def create_coupon(
    coupon: CouponCreate,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    new_coupon = await user_controller.product_collection.create_coupon(coupon)
    return new_coupon

@admin_router.patch("/coupons/{coupon_id}", response_model=Coupon)
async def update_coupon(
    coupon_id: str,
    coupon: CouponBase,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    updated_coupon = await user_controller.product_collection.update_coupon(coupon_id, coupon)
    return updated_coupon

@admin_router.delete("/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    await user_controller.product_collection.delete_coupon(coupon_id)
    return {"message": "Coupon deleted successfully"}
