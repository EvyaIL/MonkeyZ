from fastapi import APIRouter, Depends, HTTPException
from src.deps.deps import UserController, get_user_controller_dependency
from src.lib.token_handler import get_current_user
from src.models.token.token import TokenData
from src.models.user.user import Role
from src.models.products.digital_code_manager import DigitalCodeManager
from typing import List, Optional
from pydantic import BaseModel, constr

class AddCodesRequest(BaseModel):
    codes: List[str]
    activation_urls: Optional[List[str]] = None

class CodeResponse(BaseModel):
    code_id: str
    code: str
    activation_url: Optional[str]
    is_used: bool
    used_by: Optional[str]
    used_at: Optional[str]
    expiry_date: Optional[str]

class UpdateCodeRequest(BaseModel):
    new_code: Optional[str] = None
    new_activation_url: Optional[str] = None

class ProductSettingsUpdate(BaseModel):
    stock_threshold: Optional[int] = None
    auto_assign_codes: Optional[bool] = None
    code_prefix: Optional[str] = None
    expiry_days: Optional[int] = None

digital_codes_router = APIRouter(prefix="/digital-codes", tags=["digital-codes"])

async def verify_admin(user_controller: UserController, current_user: TokenData):
    """Verify that the current user has admin privileges."""
    user = await user_controller.user_collection.get_user_by_username(current_user.username)
    if not user or user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

@digital_codes_router.get("/{product_id}/stock")
async def check_stock(
    product_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Check the stock status of digital codes for a product"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return await DigitalCodeManager.check_code_availability(product)

@digital_codes_router.post("/{product_id}/codes")
async def add_codes(
    product_id: str,
    request: AddCodesRequest,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Add new digital codes to a product"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        updated_product = await DigitalCodeManager.add_codes(
            product,
            request.codes,
            request.activation_urls
        )
        return {"message": f"Added {len(request.codes)} codes", "product": updated_product}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@digital_codes_router.delete("/{product_id}/codes/{code_id}")
async def delete_code(
    product_id: str,
    code_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Delete a digital code from a product"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        updated_product = await DigitalCodeManager.delete_code(product, code_id)
        return {"message": "Code deleted successfully", "product": updated_product}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@digital_codes_router.put("/{product_id}/codes/{code_id}")
async def update_code(
    product_id: str,
    code_id: str,
    request: UpdateCodeRequest,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Update a digital code's details"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        updated_product = await DigitalCodeManager.update_code(
            product,
            code_id,
            request.new_code,
            request.new_activation_url
        )
        return {"message": "Code updated successfully", "product": updated_product}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@digital_codes_router.post("/{product_id}/settings")
async def update_product_settings(
    product_id: str,
    settings: ProductSettingsUpdate,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Update digital code settings for a product"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if settings.stock_threshold is not None:
        product.stock_threshold = settings.stock_threshold
    if settings.auto_assign_codes is not None:
        product.auto_assign_codes = settings.auto_assign_codes
    if settings.code_prefix is not None:
        product.code_prefix = settings.code_prefix
    if settings.expiry_days is not None:
        product.expiry_days = settings.expiry_days
    
    await product.save()
    return {"message": "Settings updated successfully", "product": product}

@digital_codes_router.post("/{product_id}/assign/{user_id}")
async def assign_code(
    product_id: str,
    user_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Manually assign a digital code to a user"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        code, activation_url = await DigitalCodeManager.assign_code(product, user_id)
        return {
            "message": "Code assigned successfully",
            "code": code,
            "activation_url": activation_url
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@digital_codes_router.post("/{product_id}/revoke/{code_id}")
async def revoke_code(
    product_id: str,
    code_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Revoke a used digital code"""
    await verify_admin(user_controller, current_user)
    product = await user_controller.product_collection.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        updated_product = await DigitalCodeManager.revoke_code(product, code_id)
        return {"message": "Code revoked successfully", "product": updated_product}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
