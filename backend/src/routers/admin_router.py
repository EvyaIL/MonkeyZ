from src.mongodb.orders_collection import OrdersCollection
from src.models.order import normalize_status, StatusEnum
# --- COUPON ANALYTICS RECALCULATION ---
async def recalculate_coupon_analytics(coupon_code: str, db):
    """
    Recalculates and updates the analytics for a given coupon code based on all associated orders.

    This function should be called whenever an order using a coupon is created, deleted, or has its status changed.

    It computes:
    - A breakdown of orders by status (completed, cancelled, pending, etc.).
    - A per-user usage count for all non-cancelled/failed orders.
    - The total number of times the coupon has been successfully used (i.e., is in an active state).
    """
    orders_collection = OrdersCollection()
    orders = await orders_collection.get_orders_by_coupon_code(coupon_code)

    analytics = {
        "total_orders": 0,
        "completed": 0,
        "cancelled": 0,
        "pending": 0,
        "processing": 0,
        "awaiting_stock": 0,
        "failed": 0, # Ensure all statuses are tracked
    }
    per_user_usage = {}

    # Define which statuses count as an "active" or "used" coupon.
    # This now includes pending orders. It excludes only cancelled or failed orders.
    active_statuses = {StatusEnum.PENDING.value, StatusEnum.COMPLETED.value, StatusEnum.PROCESSING.value, StatusEnum.AWAITING_STOCK.value}


    for order in orders:
        status = normalize_status(order.get("status"))
        email = order.get("email")

        if status in analytics:
            analytics[status] += 1
        analytics["total_orders"] += 1

        # A coupon is considered "used" if the order is in an active state.
        # This is the count that should be checked against `maxUsagePerUser`.
        if status in active_statuses and email:
            per_user_usage[email] = per_user_usage.get(email, 0) + 1

    # The total `usageCount` for the coupon is the sum of all orders in an active state.
    total_active_uses = sum(per_user_usage.values())

    update_payload = {
        "usageAnalytics": analytics,
        "userUsages": per_user_usage,
        "usageCount": total_active_uses,
    }

    await db.coupons.update_one({"code": coupon_code}, {"$set": update_payload})
    
    print(f"Recalculated analytics for coupon '{coupon_code}': {update_payload}")

    return update_payload

    # --- Ensure PayPal and manual orders are treated identically ---
    # This function already aggregates all orders by coupon code, regardless of payment method.
    # If PayPal orders are missing, ensure they are inserted with the same structure as manual orders in the DB.
from fastapi import APIRouter, Depends, HTTPException, status, Request

# Define the admin_router at the very top so it is available for all endpoints
admin_router = APIRouter(prefix="/admin", tags=["admin"])
from pydantic import BaseModel, ValidationError, field_validator # Import BaseModel directly, field_validator instead of field_serializer for Pydantic v2
from typing import Dict, Any, List, Optional, Union # Ensure Dict, Any are imported
from datetime import datetime, timedelta # Added datetime
from pymongo import MongoClient
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, ValidationError, field_validator
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
from beanie import PydanticObjectId
import copy

from src.models.user.user import Role
from src.deps.deps import (
    UserController, 
    get_user_controller_dependency, 
    KeyMetricsController, 
    get_key_metrics_controller_dependency, 
    get_keys_controller_dependency,
    get_admin_product_collection_dependency
)
from src.lib.token_handler import get_current_user
from src.models.token.token import TokenData
from src.mongodb.product_collection import ProductCollection
from src.controller.key_controller import KeyController
from src.lib.token_handler import get_current_user # Added get_current_user
from src.models.token.token import TokenData # Added TokenData
from src.models.user.user_exception import UserException # Added UserException

from src.models.products.products import Product as ProductModel, CDKey, CDKeyUpdateRequest, CDKeysAddRequest, AddKeysRequest
from src.models.admin.analytics import AdminAnalytics, DailySale
from src.models.products.products_exception import NotFound, NotValid
from ..mongodb.mongodb import MongoDb 
from .orders import retry_failed_orders_internal
from ..services.coupon_service import CouponService
from fastapi.responses import JSONResponse

mongo_db_instance = MongoDb()

# Coupon analytics endpoint
@admin_router.get("/coupons/{coupon_code}/analytics")
async def get_coupon_analytics(
    coupon_code: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    code_variants = [
        coupon_code.strip(),
        coupon_code.strip().lower(),
        coupon_code.strip().upper(),
        coupon_code.strip().replace(' ', ''),
        coupon_code.strip().replace(' ', '').lower(),
        coupon_code.strip().replace(' ', '').upper(),
    ]
    # Use controller method to get all coupons
    all_coupons = await user_controller.get_all_coupons()
    db_codes = [c.get('code', None) if isinstance(c, dict) else getattr(c, 'code', None) for c in all_coupons if (c.get('code', None) if isinstance(c, dict) else getattr(c, 'code', None))]
    coupon = None
    # Try exact match
    for c in all_coupons:
        db_code = c.get('code', None) if isinstance(c, dict) else getattr(c, 'code', None)
        for variant in code_variants:
            if db_code and variant and db_code.strip().lower() == variant.strip().lower():
                coupon = c
                break
        if coupon:
            break
    # Try partial match if not found
    if not coupon:
        for c in all_coupons:
            db_code = c.get('code', None) if isinstance(c, dict) else getattr(c, 'code', None)
            for variant in code_variants:
                if db_code and variant and variant.strip().lower() in db_code.strip().lower():
                    coupon = c
                    break
            if coupon:
                break
    # Try to find by partial code in the whole coupon collection
    if not coupon:
        for c in all_coupons:
            db_code = c.get('code', '') if isinstance(c, dict) else getattr(c, 'code', '')
            if db_code and coupon_code.strip().lower() in db_code.strip().lower():
                coupon = c
                break
        # Always return a valid analytics object for frontend compatibility
        return {
            "total": 0,
            "completed": 0,
            "cancelled": 0,
            "pending": 0,
            "processing": 0,
            "awaiting_stock": 0,
            "unique_users": 0,
            "user_usages": {},
            "usage_count": 0,
            "max_usage_per_user": 0,
            "usageAnalytics": {},
            "userUsages": {},
        }

    # Extract analytics fields from coupon document, fallback to alternative field names if needed
    coupon_dict = coupon if isinstance(coupon, dict) else (coupon.dict() if hasattr(coupon, 'dict') else coupon)
    usage_analytics = coupon_dict.get("usageAnalytics", coupon_dict.get("usage_analytics", {}))
    user_usages = coupon_dict.get("userUsages", coupon_dict.get("user_usages", {}))
    usage_count = coupon_dict.get("uses", coupon_dict.get("usageCount", coupon_dict.get("usage_count", 0)))

    def get_field(analytics_dict, *keys, default=0):
        for k in keys:
            if k in analytics_dict:
                return analytics_dict[k]
        return default

    analytics = {
        "total": get_field(usage_analytics, "total", "uses", default=usage_count),
        "completed": get_field(usage_analytics, "completed"),
        "cancelled": get_field(usage_analytics, "cancelled"),
        "pending": get_field(usage_analytics, "pending"),
        "processing": get_field(usage_analytics, "processing"),
        "awaiting_stock": get_field(usage_analytics, "awaitingStock", "awaiting_stock"),
    }

    if not analytics["total"]:
        analytics["total"] = sum(
            sum(v.values()) if isinstance(v, dict) else v
            for v in user_usages.values()
            if isinstance(v, (dict, int, float))
        )

    def recursive_sum(d):
        if isinstance(d, dict):
            return sum(recursive_sum(v) for v in d.values())
        elif isinstance(d, (int, float)):
            return d
        return 0

    flat_user_usages = {user: recursive_sum(usage) for user, usage in user_usages.items()}
    analytics["unique_users"] = sum(1 for v in flat_user_usages.values() if v > 0)
    analytics["user_usages"] = flat_user_usages
    analytics["usage_count"] = usage_count
    analytics["max_usage_per_user"] = coupon_dict.get("maxUsagePerUser", coupon_dict.get("max_usage_per_user", 0))
    analytics["usageAnalytics"] = usage_analytics if isinstance(usage_analytics, dict) else {}
    analytics["userUsages"] = flat_user_usages if isinstance(flat_user_usages, dict) else {}
    return analytics
    
# --- NEW: Coupon info endpoint for frontend dialog ---
@admin_router.get("/coupons/info")
async def get_coupon_info(
    code: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    # Aggressive code matching (same as analytics)
    code_variants = [
        code.strip(),
        code.strip().lower(),
        code.strip().upper(),
        code.strip().replace(' ', ''),
        code.strip().replace(' ', '').lower(),
        code.strip().replace(' ', '').upper(),
    ]
    all_coupons_cursor = user_controller.db.coupons.find({})
    all_coupons = await all_coupons_cursor.to_list(length=1000)
    db_codes = [c.get('code', None) for c in all_coupons if c.get('code', None)]
    coupon = None
    for db_code in db_codes:
        for variant in code_variants:
            if db_code and variant and db_code.strip().lower() == variant.strip().lower():
                coupon = await user_controller.db.coupons.find_one({"code": db_code})
                break
        if coupon:
            break
    if not coupon:
        for db_code in db_codes:
            for variant in code_variants:
                if db_code and variant and variant.strip().lower() in db_code.strip().lower():
                    coupon = await user_controller.db.coupons.find_one({"code": db_code})
                    break
            if coupon:
                break
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    # Format for frontend
    coupon_dict = coupon.copy() if isinstance(coupon, dict) else coupon
    if "_id" in coupon_dict and "id" not in coupon_dict:
        coupon_dict["id"] = str(coupon_dict.pop("_id"))
    elif "_id" in coupon_dict:
        coupon_dict.pop("_id")
    # Ensure discountPercent for percentage type
    if coupon_dict.get("discountType") == "percentage":
        coupon_dict["discountPercent"] = coupon_dict.get("discountValue")
    return coupon_dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, ValidationError, field_validator # Import BaseModel directly, field_validator instead of field_serializer for Pydantic v2
from typing import Dict, Any, List, Optional, Union # Ensure Dict, Any are imported
from datetime import datetime, timedelta # Added datetime
from bson.objectid import ObjectId # Added ObjectId
from beanie import PydanticObjectId # Added PydanticObjectId for Beanie
import copy

from src.models.user.user import Role
from src.deps.deps import (
    UserController, 
    get_user_controller_dependency, 
    KeyMetricsController, 
    get_key_metrics_controller_dependency, 
    get_keys_controller_dependency,
    get_admin_product_collection_dependency
)
from src.mongodb.product_collection import ProductCollection
from src.controller.key_controller import KeyController
from src.lib.token_handler import get_current_user # Added get_current_user
from src.models.token.token import TokenData # Added TokenData
from src.models.user.user_exception import UserException # Added UserException

from src.models.products.products import Product as ProductModel, CDKey, CDKeyUpdateRequest, CDKeysAddRequest, AddKeysRequest
from src.models.admin.analytics import AdminAnalytics, DailySale
from src.models.products.products_exception import NotFound, NotValid
from ..mongodb.mongodb import MongoDb 
from .orders import retry_failed_orders_internal
from ..services.coupon_service import CouponService
from fastapi.responses import JSONResponse


class ProductBase(BaseModel):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: float
    imageUrl: str
    active: bool = True
    category: Optional[str] = None
    metadata: Optional[dict] = None  # Stores translations and other metadata
    is_new: bool = False  # New tag
    percent_off: int = 0  # Discount percentage
    best_seller: bool = False  # Best Seller tag
    displayOnHomePage: bool = False  # Homepage display flag
    slug: Optional[str] = None  # Unique URL-friendly identifier
    manages_cd_keys: Optional[bool] = None # <<<< ADDED THIS LINE

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

class CouponBase(BaseModel):
    code: str
    discountType: str = "percentage"  # "percentage" or "fixed"
    discountValue: float
    discountPercent: Optional[float] = None  # This will be populated based on discountValue for percentage discounts
    active: bool = True
    expiresAt: Optional[datetime] = None
    maxUses: Optional[int] = None
    usageCount: int = 0
    # ...existing fields...
    maxUsagePerUser: int = 0  # Allow typing and saving per-user max uses

    @field_validator('maxUsagePerUser')
    def validate_max_usage_per_user(cls, v):
        # Always save as a positive integer (0 means unlimited)
        if v is None:
            return 0
        try:
            v_int = int(v)
        except (ValueError, TypeError):
            return 0
        if v_int < 0:
            return 0
        return v_int
    model_config = {
        "populate_by_name": True
    }
    
    @field_validator('discountValue')
    def validate_discount(cls, v, values, **kwargs):
        if v is None:
            raise ValueError('discountValue is required')
            
        # For Pydantic v2, `values` is not directly passed to field_validator like in v1.
        # You need to access other fields via `self` if it's a model validator, 
        # or handle it differently if it's a simple field validator.
        # This part might need adjustment based on how you access `discountType` in Pydantic v2.
        # Assuming `values` here refers to the model's data, which is not standard for `field_validator`.
        # A common pattern is to use a `model_validator` for cross-field validation.
        # However, if `discountType` is not available here, this logic will fail.
        # Let's assume for now this is intended to be a simple validator on `discountValue` itself.
        # if values.data.get('discountType') == 'percentage': # Example of accessing other fields in Pydantic v2
        #     if v < 0 or v > 100:
        #         raise ValueError('Percentage discount must be between 0 and 100')
        # elif v < 0:
        #     raise ValueError('Fixed discount cannot be negative')
        return float(v)

class CouponCreate(CouponBase):
    pass

class Coupon(CouponBase):
    id: str  # Using str for compatibility with MongoDB ObjectId
    createdAt: datetime
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v),
        }
    }
    
    # @field_serializer('id') # field_serializer is for output serialization
    # def serialize_id(self, id: Any) -> str:
    #     if isinstance(id, ObjectId):
    #         return str(id)
    #     return id
        
    # @validator('discountPercent') # Changed to field_validator or model_validator
    # def compute_discount_percent(cls, v, values, **kwargs):
    #     """Compute discountPercent from discountValue for percentage type discounts"""
    #     if values.data.get('discountType') == 'percentage': # Accessing other fields in Pydantic v2
    #         return values.data.get('discountValue')
    #     return None  # For fixed discounts, discountPercent is not applicable

    # It's generally better to compute discountPercent dynamically or ensure it's set correctly upon creation/update.
    # If it must be a validated/computed field, a `model_validator` might be more appropriate.
    # For example:
    # from pydantic import model_validator
    # @model_validator(mode='after')
    # def compute_discount_percent_v2(self):
    #     if self.discountType == 'percentage' and self.discountValue is not None:
    #         self.discountPercent = self.discountValue
    #     else:
    #         self.discountPercent = None
    #     return self

class OrderItem(BaseModel):
    productId: str
    name: str
    quantity: int
    price: float

class OrderBase(BaseModel):
    customerName: str
    email: str
    phone: Optional[str] = None
    status: str = "Pending"
    total: float
    items: List[OrderItem]

class Order(OrderBase):
    id: str
    date: datetime = datetime.utcnow()
    createdAt: datetime = datetime.utcnow()
    statusHistory: List[Dict[str, Any]] = []

    model_config = {
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str
        }
    }

class ProductKeysRequest(BaseModel):
    keys: List[str]

# New request model for adding CDKeys conforming to the CDKey schema
class CDKeysAddRequest(BaseModel):
    keys: List[CDKey] # Expecting a list of CDKey objects



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
    try:
        # The get_all_products method now returns sanitized and validated Product models.
        # No need for manual processing here.
        products_from_db = await user_controller.product_collection.get_all_products()

        # The response_model will handle converting the list of Product models to JSON.
        return products_from_db
    except Exception as e:
        print(f"Critical error in get_products: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching products")

@admin_router.post("/products", response_model=Product)
async def create_product(
    product: dict,  # Use dict to accept any product structure with complex name/description
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    # Ensure product_data is a dict for create_product
    product_data_dict = product if isinstance(product, dict) else product.model_dump(by_alias=True) # Pydantic v2

    # Ensure metadata.translations exists
    if 'metadata' not in product_data_dict:
        product_data_dict['metadata'] = {'translations': {}}
    elif 'translations' not in product_data_dict['metadata']:
        product_data_dict['metadata']['translations'] = {}
    
    # Set up translations structure if not present
    translations = product_data_dict['metadata']['translations']
    if 'name' not in translations:
        translations['name'] = {'en': product_data_dict['name']}
    if 'description' not in translations:
        translations['description'] = {'en': product_data_dict['description']}
    
    # Make sure we have imageUrl - frontend might use image or imageUrl property
    if 'image' in product_data_dict and not product_data_dict.get('imageUrl'):
        product_data_dict['imageUrl'] = product_data_dict.get('image')
      # Handle field name conversion for compatibility
    # Convert camelCase to snake_case for backend model
    if 'createdAt' in product_data_dict and 'created_at' not in product_data_dict:
        product_data_dict['created_at'] = product_data_dict['createdAt']
    if 'updatedAt' in product_data_dict and 'updated_at' not in product_data_dict:
        product_data_dict['updated_at'] = product_data_dict['updatedAt']
    
    # Set timestamps
    product_data_dict['created_at'] = datetime.now()
    product_data_dict['updated_at'] = datetime.now()    # Ensure boolean fields are properly converted
    if 'displayOnHomePage' in product_data_dict:
        product_data_dict['displayOnHomePage'] = bool(product_data_dict['displayOnHomePage'])
    if 'best_seller' in product_data_dict:
        product_data_dict['best_seller'] = bool(product_data_dict['best_seller'])
    
    # Ensure slug field exists (will be further processed in collection class)
    if not product_data_dict.get('slug'):
        # Allow the collection class to generate the slug
        product_data_dict['slug'] = None
    
    new_product = await user_controller.product_collection.create_product(product_data_dict) # Changed from create_admin_product
      # Convert to dict to ensure proper serialization
    product_dict = new_product.dict() if hasattr(new_product, 'dict') else (
        new_product.model_dump() if hasattr(new_product, 'model_dump') else new_product
    )
    
    # Ensure id is properly formatted
    if "_id" in product_dict and "id" not in product_dict:
        product_dict["id"] = str(product_dict.pop("_id"))
    elif "_id" in product_dict:
        product_dict.pop("_id")  # Remove _id if id already exists
        
    # Convert snake_case to camelCase fields
    if "created_at" in product_dict:
        product_dict["createdAt"] = product_dict.pop("created_at")
    if "updated_at" in product_dict:
        product_dict["updatedAt"] = product_dict.pop("updated_at")
        
    # Ensure required fields exist with default values
    if "imageUrl" not in product_dict or not product_dict["imageUrl"]:
        product_dict["imageUrl"] = product_dict.get("image", "")  # Use image if available, otherwise empty
    
    # Ensure timestamps are present
    if "createdAt" not in product_dict:
        product_dict["createdAt"] = datetime.utcnow()
    if "updatedAt" not in product_dict:
        product_dict["updatedAt"] = datetime.utcnow()
        
    # Ensure boolean fields are properly set
    if "best_seller" in product_dict:
        product_dict["best_seller"] = bool(product_dict["best_seller"])
    if "displayOnHomePage" in product_dict:
        product_dict["displayOnHomePage"] = bool(product_dict["displayOnHomePage"])
        
    return product_dict

@admin_router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product: ProductBase,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    # Ensure product is a dict for update_product
    product_data_dict = product.model_dump(by_alias=True, exclude_unset=True) # Pydantic v2
    updated_product = await user_controller.product_collection.update_product(product_id, product_data_dict) # Changed from update_admin_product
    # Sync to public collection is no longer needed as we operate directly on shop.Product
    # await user_controller.sync_products()
    # --- SERIALIZATION FIX START ---    # Convert to dict to ensure proper serialization
    product_dict = updated_product.dict() if hasattr(updated_product, 'dict') else (
        updated_product.model_dump() if hasattr(updated_product, 'model_dump') else updated_product
    )
    # Ensure id is a string
    if "_id" in product_dict and "id" not in product_dict:
        product_dict["id"] = str(product_dict.pop("_id"))
    elif "id" in product_dict and not isinstance(product_dict["id"], str):
        product_dict["id"] = str(product_dict["id"])
          # Convert snake_case to camelCase fields
    if "created_at" in product_dict and "createdAt" not in product_dict:
        product_dict["createdAt"] = product_dict.pop("created_at")
    if "updated_at" in product_dict and "updatedAt" not in product_dict:
        product_dict["updatedAt"] = product_dict.pop("updated_at")
    
    # Ensure required fields exist with default values
    if "imageUrl" not in product_dict:
        product_dict["imageUrl"] = product_dict.get("image", "")  # Use image if available, otherwise empty
        
    # Add current time to createdAt/updatedAt if missing
    if "createdAt" not in product_dict:
        product_dict["createdAt"] = datetime.utcnow()
    if "updatedAt" not in product_dict:
        product_dict["updatedAt"] = datetime.utcnow()
        
    # Ensure metadata is a plain dict (not a Pydantic model)
    if "metadata" in product_dict and hasattr(product_dict["metadata"], "dict"):
        product_dict["metadata"] = product_dict["metadata"].dict()
    # Defensive: if metadata is still a Pydantic model, convert recursively    import pydantic
    
    def to_dict(obj):
        if isinstance(obj, dict):
            return {k: to_dict(v) for k, v in obj.items()}
        elif hasattr(obj, 'dict'):
            return obj.dict()
        elif isinstance(obj, list):
            return [to_dict(i) for i in obj]
        return obj
        
    if "metadata" in product_dict and not isinstance(product_dict["metadata"], dict):
        product_dict["metadata"] = to_dict(product_dict["metadata"])
    # --- SERIALIZATION FIX END ---
    return product_dict

@admin_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    await user_controller.product_collection.delete_product(product_id) # Changed from delete_admin_product
    # Sync to public collection is no longer needed
    # await user_controller.sync_products()
    return {"message": "Product deleted successfully"}

# Endpoint to add CD keys to a product
@admin_router.post("/products/{product_id}/cdkeys", response_model=ProductModel)
async def add_cd_keys_to_product(
    product_id: PydanticObjectId, 
    request: CDKeysAddRequest, 
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    try:
        key_strings = [cd_key.key for cd_key in request.keys]
        # Use product_collection (shop.Product) directly
        updated_product = await user_controller.product_collection.add_keys_to_product(product_id, key_strings)
        return updated_product
    except ValueError as e:
        if "not found" in str(e).lower(): # For product not found
            raise HTTPException(status_code=404, detail=str(e))
        elif "does not manage cd keys" in str(e) or "does not manage cd keys" in str(e).lower():
            raise HTTPException(status_code=400, detail=str(e)) # Bad Request
        else: # Other ValueErrors like duplicate keys, empty keys etc.
            raise HTTPException(status_code=422, detail=str(e)) # Unprocessable Entity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add CD keys: {str(e)}")

# Endpoint to get CD keys for a product
@admin_router.get("/products/{product_id}/cdkeys", response_model=List[CDKey])
async def get_cd_keys_for_product(
    product_id: PydanticObjectId, 
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    try:
        # Use product_collection (shop.Product) directly
        product = await user_controller.product_collection.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if not product.manages_cd_keys:
            # This error is specific and indicates a configuration issue with an existing product.
            raise HTTPException(status_code=400, detail=f"Product '{product.name.get('en', str(product.id))}' does not manage CD keys.")
        return product.cdKeys if product.cdKeys else []
    except ValueError as e: # Catches PydanticObjectId validation errors or other ValueErrors from get_product_by_id if any
        raise HTTPException(status_code=400, detail=f"Invalid product ID or error fetching product: {str(e)}")
    except HTTPException: # Re-raise existing HTTPExceptions
        raise
    except Exception as e: # Catch-all for other unexpected errors
        raise HTTPException(status_code=500, detail=f"Failed to get CD keys: {str(e)}")

@admin_router.patch("/products/{product_id}/cdkeys/{cd_key_index}", response_model=ProductModel)
async def update_cd_key_for_product(
    product_id: PydanticObjectId,
    cd_key_index: int,
    request: CDKeyUpdateRequest, # FastAPI will try to parse the body into this
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    try:
        validated_request: CDKeyUpdateRequest
        # Log the type and content of the request for debugging
        print(f"Received request in update_cd_key_for_product. Type: {type(request)}, Content: {request}")

        if isinstance(request, dict):
            print(f"Request is a dict, attempting to parse as CDKeyUpdateRequest: {request}")
            try:
                # Pydantic v2 uses model_validate. If using Pydantic v1, use CDKeyUpdateRequest(**request)
                validated_request = CDKeyUpdateRequest.model_validate(request)
            except ValidationError as ve:
                print(f"Validation failed for dict: {ve}")
                # Log the detailed validation errors
                error_details = ve.errors()
                print(f"Detailed validation errors: {error_details}")
                raise HTTPException(status_code=422, detail=f"Invalid request data: {error_details}")
        elif isinstance(request, CDKeyUpdateRequest):
            print("Request is already a CDKeyUpdateRequest model.")
            validated_request = request
        else:
            # This case should ideally not be reached if FastAPI type hints work as expected
            print(f"Unexpected request type: {type(request)}. Raising 400 error.")
            raise HTTPException(status_code=400, detail=f"Unexpected request type: {type(request).__name__}")

        # Convert Pydantic model to dict, excluding unset fields to prevent overwriting with defaults
        # Pydantic v2 uses model_dump. If using Pydantic v1, use .dict(exclude_unset=True)
        update_data_dict = validated_request.model_dump(exclude_unset=True)
        print(f"Data after model_dump(exclude_unset=True): {update_data_dict}")
        
        # CRITICAL: Ensure the 'key' field itself is never part of the update payload from this endpoint.
        # This endpoint is for updating status (isUsed, usedAt, orderId), not the key string.
        if 'key' in update_data_dict:
            print(f"WARNING: 'key' field was present in update_data_dict and is being removed: {update_data_dict['key']}")
            del update_data_dict['key']
        
        print(f"Sanitized update_data_dict for DB operation: {update_data_dict}")

        if not update_data_dict:
            print("No valid fields to update after sanitization. Fetching current product.")
            # Use product_collection (shop.Product) directly
            product = await user_controller.product_collection.get_product_by_id(product_id)
            if not product:
                raise HTTPException(status_code=404, detail="Product not found after no-op update.")
            return product

        # Use product_collection (shop.Product) directly
        updated_product = await user_controller.product_collection.update_cd_key_in_product(
            product_id, cd_key_index, update_data_dict
        )
        return updated_product
    except ValueError as e: 
        if "not found" in str(e).lower(): # Product or key index not found
            raise HTTPException(status_code=404, detail=str(e))
        elif "does not manage cd keys" in str(e).lower(): # Product exists but not configured for keys
            raise HTTPException(status_code=400, detail=str(e))
        else: # Other ValueErrors (e.g. bad index if not caught by "not found")
            raise HTTPException(status_code=422, detail=str(e))
    except HTTPException: 
        raise
    except Exception as e:
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred while updating the CD key: {str(e)}")

@admin_router.delete("/products/{product_id}/cdkeys/{cd_key_index}", response_model=ProductModel)
async def delete_cd_key_for_product(
    product_id: PydanticObjectId,
    cd_key_index: int,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    try:
        updated_product = await user_controller.admin_product_collection.delete_cd_key_from_product(
            product_id, cd_key_index
        )
        return updated_product
    except ValueError as e:
        if "not found" in str(e).lower(): # Product or key index not found
            raise HTTPException(status_code=404, detail=str(e))
        elif "does not manage CD keys" in str(e).lower(): # Product exists but not configured for keys
            raise HTTPException(status_code=400, detail=str(e))
        else: # Other ValueErrors
            raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete CD key: {str(e)}")

# Coupon routes
@admin_router.get("/coupons", response_model=List[Coupon])
async def get_coupons(
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    coupons = await user_controller.get_all_coupons()  # Using the controller method instead of accessing collection directly
    
    # Convert backend model to frontend format for each coupon
    result = []
    for coupon in coupons:
        try:
            # Handle both dict and document objects
            coupon_dict = coupon.dict() if hasattr(coupon, 'dict') else (
                coupon.model_dump() if hasattr(coupon, 'model_dump') else coupon
            )
            
            # Ensure _id is properly converted to string id
            if "_id" in coupon_dict and "id" not in coupon_dict:
                coupon_dict["id"] = str(coupon_dict.pop("_id"))
            elif "_id" in coupon_dict:
                coupon_dict.pop("_id")
                
            # Convert ObjectId to string if it exists
            if "id" in coupon_dict and isinstance(coupon_dict["id"], ObjectId):
                coupon_dict["id"] = str(coupon_dict["id"])
            
            # Ensure discountPercent is set properly for frontend
            if "discountValue" in coupon_dict and "discountType" in coupon_dict:
                if coupon_dict["discountType"] == "percentage":
                    coupon_dict["discountPercent"] = coupon_dict["discountValue"]
                else:
                    # If it's a fixed discount, you might want to handle differently
                    coupon_dict["discountPercent"] = coupon_dict["discountValue"]
            
            result.append(coupon_dict)
        except Exception as e:
            # Log error but continue processing other coupons
            print(f"Error processing coupon: {e}")
            continue
    
    return result

@admin_router.post("/coupons", response_model=Coupon)
async def create_coupon(
    coupon: CouponCreate,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
      # Convert the model to a dict for processing
    coupon_data = coupon.dict()
    # Keep the discount type as specified in the request
    # Only convert values to proper format
    if coupon_data["discountType"] == "percentage":
        coupon_data["discountValue"] = float(coupon_data["discountValue"])
        if "discountPercent" in coupon_data:
            if coupon_data["discountPercent"] is not None:
                coupon_data["discountValue"] = float(coupon_data.pop("discountPercent"))
    else:
        coupon_data["discountType"] = "fixed"
        coupon_data["discountValue"] = float(coupon_data["discountValue"])
    # Convert ISOString to datetime if present
    if coupon.expiresAt and isinstance(coupon.expiresAt, str):
        coupon_data["expiresAt"] = datetime.fromisoformat(coupon.expiresAt.replace('Z', '+00:00'))
    # Ensure maxUsagePerUser is a positive integer (0 means unlimited)
    try:
        coupon_data["maxUsagePerUser"] = int(coupon_data.get("maxUsagePerUser", 0))
        if coupon_data["maxUsagePerUser"] < 0:
            coupon_data["maxUsagePerUser"] = 0
    except Exception:
        coupon_data["maxUsagePerUser"] = 0
    
    new_coupon = await user_controller.create_coupon(coupon_data)
    
    # Convert to dict to ensure proper serialization
    coupon_dict = new_coupon.dict() if hasattr(new_coupon, 'dict') else new_coupon
    
    # Ensure discountPercent is set properly for frontend
    if "discountValue" in coupon_dict and "discountType" in coupon_dict:
        if coupon_dict["discountType"] == "percentage":
            coupon_dict["discountPercent"] = coupon_dict["discountValue"]
    
    return coupon_dict

@admin_router.patch("/coupons/{coupon_id}", response_model=Coupon)
async def update_coupon(
    coupon_id: str,
    coupon: CouponBase,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    
    # Convert the model to a dict for processing
    coupon_data = coupon.dict()

    # Convert discountPercent to discountValue for MongoDB model
    if "discountPercent" in coupon_data:
        coupon_data["discountValue"] = coupon_data.pop("discountPercent")
        coupon_data["discountType"] = "percentage"

    # Ensure maxUsagePerUser is a positive integer (0 means unlimited)
    try:
        coupon_data["maxUsagePerUser"] = int(coupon_data.get("maxUsagePerUser", 0))
        if coupon_data["maxUsagePerUser"] < 0:
            coupon_data["maxUsagePerUser"] = 0
    except Exception:
        coupon_data["maxUsagePerUser"] = 0

    updated_coupon = await user_controller.update_coupon(coupon_id, coupon_data)  # Using the controller method

    # Convert backend model to frontend format
    coupon_dict = updated_coupon.dict() if hasattr(updated_coupon, 'dict') else updated_coupon

    # Ensure discountPercent is set properly for frontend
    if "discountValue" in coupon_dict and "discountType" in coupon_dict:
        if coupon_dict["discountType"] == "percentage":
            coupon_dict["discountPercent"] = coupon_dict["discountValue"]

    return coupon_dict

@admin_router.delete("/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    await user_controller.delete_coupon(coupon_id)  # Using the controller method
    return {"message": "Coupon deleted successfully"}

@admin_router.get("/analytics", response_model=AdminAnalytics)
async def get_analytics(
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Get analytics data for the admin dashboard."""
    await verify_admin(user_controller, current_user)
    
    # Get all orders
    orders = await user_controller.product_collection.get_all_orders()
    
    # Calculate total sales and orders
    total_sales = sum(order.total for order in orders if order.status != "cancelled")
    total_orders = len([o for o in orders if o.status != "cancelled"])
    
    # Calculate average order value
    average_order_value = total_sales / total_orders if total_orders > 0 else 0
    
    # Calculate daily sales for the last 30 days
    daily_sales = []
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # Create a dict to store daily totals
    daily_totals = {}
    
    # Calculate sales for each day
    for order in orders:
        order_date = order.date
        if start_date <= order_date <= end_date and order.status != "cancelled":
            date_str = order_date.strftime("%Y-%m-%d")
            if date_str not in daily_totals:
                daily_totals[date_str] = 0
            daily_totals[date_str] += order.total
    
    # Fill in any missing days with zero sales
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        daily_sales.append(DailySale(
            date=date_str,
            amount=daily_totals.get(date_str, 0)
        ))
        current_date += timedelta(days=1)
    
    return AdminAnalytics(
        totalSales=total_sales,
        totalOrders=total_orders,
        averageOrderValue=average_order_value,
        dailySales=sorted(daily_sales, key=lambda x: x.date)
    )

# Order routes
@admin_router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user: TokenData = Depends(get_current_user),
    user_controller: UserController = Depends(get_user_controller_dependency)
):
    try:
        # Using verify_admin for consistency across routes
        await verify_admin(user_controller, current_user)
          # Return mock order data
        mock_orders = [
            {
                "id": "order1",
                "customerName": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1-555-0123",
                "date": datetime.now() - timedelta(days=3),
                "total": 49.99,
                "status": "completed",
                "items": [
                    {"productId": "1", "name": "MonkeyZ Pro Key", "quantity": 1, "price": 49.99}
                ],
                "statusHistory": [
                    {"status": "pending", "date": datetime.now() - timedelta(days=3, hours=2)},
                    {"status": "processing", "date": datetime.now() - timedelta(days=3, hours=1)},
                    {"status": "completed", "date": datetime.now() - timedelta(days=3)}
                ]
            },
            {
                "id": "order2",
                "customerName": "Jane Smith",
                "email": "jane.smith@example.com",
                "phone": "+1-555-0456",
                "date": datetime.now() - timedelta(days=1),
                "total": 29.99,                "status": "processing",
                "items": [
                    {"productId": "2", "name": "MonkeyZ Standard License", "quantity": 1, "price": 29.99}
                ],
                "statusHistory": [
                    {"status": "pending", "date": datetime.now() - timedelta(days=1, hours=3)},
                    {"status": "processing", "date": datetime.now() - timedelta(days=1)}
                ]
            }
        ]
        return mock_orders
        
        orders = user_controller.db.orders.find()
        order_list = []
        for order in orders:
            order["id"] = str(order["_id"])
            order_list.append(order)
        return order_list
    except UserException as e:
        raise HTTPException(status_code=e.status_code, detail=e.msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.post("/orders", response_model=Order)
async def create_order(
    order: OrderBase,
    current_user: TokenData = Depends(get_current_user),
    user_controller: UserController = Depends(get_user_controller_dependency)
):
    try:
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        # Log the incoming order data
        logger.info(f"Creating order: {order}")
        
        # Verify admin role
        if not user_controller.has_role(current_user.sub, Role.ADMIN):
            raise UserException(
                "Unauthorized: Admin role required",
                status_code=403
            )
        
        # Create order document
        order_dict = order.model_dump()
        order_dict["statusHistory"] = [
            {
                "status": order.status,
                "date": datetime.utcnow(),
                "note": "Order created"
            }
        ]
        order_dict["createdAt"] = datetime.utcnow()
        order_dict["date"] = datetime.utcnow()
        
        # Log order_dict before insertion
        logger.info(f"Order document to insert: {order_dict}")
        
        # Insert order into database
        try:
            result = user_controller.db.orders.insert_one(order_dict)
            logger.info(f"Order inserted with ID: {result.inserted_id}")
            
            # Retrieve the created order
            created_order = user_controller.db.orders.find_one({"_id": result.inserted_id})
            if not created_order:
                logger.error(f"Could not find created order with ID: {result.inserted_id}")
                raise HTTPException(status_code=500, detail="Order was created but could not be retrieved")
                
            # Add string ID for compatibility
            created_order["id"] = str(created_order["_id"])
            logger.info(f"Returning created order: {created_order}")
            
            return created_order
        except Exception as e:
            logger.error(f"Database error creating order: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    except UserException as e:
        raise HTTPException(status_code=e.status_code, detail=e.msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@admin_router.patch("/orders/{order_id}", response_model=Order)
async def update_order_status(
    order_id: str,
    update: Dict[str, Any],
    current_user: TokenData = Depends(get_current_user),
    user_controller: UserController = Depends(get_user_controller_dependency)
):
    try:
        # Verify admin role
        if not user_controller.has_role(current_user.sub, Role.ADMIN):
            raise UserException(
                "Unauthorized: Admin role required",
                status_code=403
            )
        
        # Find the order
        order = user_controller.db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update status and add to history
        if "status" in update:
            history_entry = {
                "status": update["status"],
                "date": datetime.utcnow()
            }
            if "statusUpdateDate" in update:
                history_entry["date"] = update["statusUpdateDate"]
            
            user_controller.db.orders.update_one(
                {"_id": ObjectId(order_id)},
                {
                    "$set": {"status": update["status"]},
                    "$push": {"statusHistory": history_entry}
                }
            )
        
        updated_order = user_controller.db.orders.find_one({"_id": ObjectId(order_id)})
        updated_order["id"] = str(updated_order["_id"])
        return updated_order
    except UserException as e:
        raise HTTPException(status_code=e.status_code, detail=e.msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Import the DashboardStats model
class DashboardStats(BaseModel):
    totalOrders: int = 0
    totalProducts: int = 0
    totalRevenue: float = 0.0
    activeUsers: int = 0

# Dashboard stats endpoint
@admin_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    try:
        # Provide mock data for dashboard stats
        stats = DashboardStats(
            totalOrders=15, 
            totalProducts=24,
            totalRevenue=1250.75, 
            activeUsers=8
        )
        return stats
    except Exception as e:
        print(f"Error in get_dashboard_stats: {str(e)}")
        # Return default stats instead of failing
        return DashboardStats()

class KeyUsageByProduct(BaseModel):
    productId: str
    productName: str
    totalKeys: int
    availableKeys: int

class KeyMetrics(BaseModel):
    totalKeys: int
    availableKeys: int
    usedKeys: int
    expiredKeys: int
    lowStockProducts: int
    averageKeyUsageTime: Optional[float] = None
    keyUsageByProduct: List[KeyUsageByProduct]

@admin_router.get("/key-metrics", response_model=KeyMetrics)
async def get_key_metrics(
    key_metrics_controller: KeyMetricsController = Depends(get_key_metrics_controller_dependency),
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    """Get metrics about key usage and availability."""
    await verify_admin(user_controller, current_user)
    
    # Get metrics from the dedicated controller
    # MODIFIED: Call the diagnostic version
    metrics = await key_metrics_controller.get_key_metrics_diagnostic(current_user=current_user)
    return metrics

@admin_router.post("/api/coupons/validate")
async def validate_coupon(request: Request):
    data = await request.json()
    code = data.get("code")
    amount = data.get("amount", 0)
    user_email = data.get("email")
    db = await MongoDb().get_db()
    coupon_service = CouponService(db)
    discount, coupon, error = await coupon_service.validate_and_apply_coupon(code, amount, user_email=user_email)
    if error:
        return JSONResponse({"discount": 0, "message": error}, status_code=400)
    return {"discount": discount, "message": "Coupon valid!", "coupon": coupon}

@admin_router.get("/api/coupons/info")
async def get_coupon_info(
    code: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
):
    code_variants = [
        code.strip(),
        code.strip().lower(),
        code.strip().upper(),
        code.strip().replace(' ', ''),
        code.strip().replace(' ', '').lower(),
        code.strip().replace(' ', '').upper(),
    ]
    all_coupons_cursor = user_controller.db.coupons.find({})
    all_coupons = await all_coupons_cursor.to_list(length=1000)
    db_codes = [c.get('code', None) for c in all_coupons if c.get('code', None)]
    coupon = None
    for db_code in db_codes:
        for variant in code_variants:
            if db_code and variant and db_code.strip().lower() == variant.strip().lower():
                coupon = await user_controller.db.coupons.find_one({"code": db_code})
                break
        if coupon:
            break
    if not coupon:
        for db_code in db_codes:
            for variant in code_variants:
                if db_code and variant and variant.strip().lower() in db_code.strip().lower():
                    coupon = await user_controller.db.coupons.find_one({"code": db_code})
                    break
            if coupon:
                break
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    coupon_dict = coupon.copy() if isinstance(coupon, dict) else coupon
    if "_id" in coupon_dict and "id" not in coupon_dict:
        coupon_dict["id"] = str(coupon_dict.pop("_id"))
    elif "_id" in coupon_dict:
        coupon_dict.pop("_id")
    if "discountValue" in coupon_dict and "discountType" in coupon_dict:
        if coupon_dict["discountType"] == "percentage":
            coupon_dict["discountPercent"] = coupon_dict["discountValue"]
        else:
            coupon_dict["discountPercent"] = coupon_dict["discountValue"]
    return coupon_dict

# End of file
