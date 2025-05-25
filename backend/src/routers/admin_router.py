from fastapi import APIRouter, Depends, HTTPException
from src.models.user.user import Role
from src.deps.deps import UserController, get_user_controller_dependency
from src.lib.token_handler import get_current_user
from src.models.token.token import TokenData
from src.models.user.user_exception import UserException
from typing import List, Optional, Any, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel, validator, field_serializer
from bson.objectid import ObjectId
from src.models.admin.analytics import AdminAnalytics, DailySale

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
    discountType: str = "percentage"  # "percentage" or "fixed"
    discountValue: float
    discountPercent: Optional[float] = None  # This will be populated based on discountValue for percentage discounts
    active: bool = True
    expiresAt: Optional[datetime] = None
    maxUses: Optional[int] = None
    usageCount: int = 0
    
    model_config = {
        "populate_by_name": True
    }
    
    @validator('discountValue')
    def validate_discount(cls, v, values, **kwargs):
        if v is None:
            raise ValueError('discountValue is required')
            
        if values.get('discountType') == 'percentage':
            if v < 0 or v > 100:
                raise ValueError('Percentage discount must be between 0 and 100')
        elif v < 0:
            raise ValueError('Fixed discount cannot be negative')
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
    
    @field_serializer('id')
    def serialize_id(self, id: Any) -> str:
        if isinstance(id, ObjectId):
            return str(id)
        return id
        
    @validator('discountPercent')
    def compute_discount_percent(cls, v, values, **kwargs):
        """Compute discountPercent from discountValue for percentage type discounts"""
        if values.get('discountType') == 'percentage':
            return values.get('discountValue')
        return None  # For fixed discounts, discountPercent is not applicable

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
    products = await user_controller.get_admin_products()  # This will also sync collections
    return products

@admin_router.post("/products", response_model=Product)
async def create_product(
    product: ProductCreate,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    new_product = await user_controller.create_admin_product(product.dict())
    return new_product

@admin_router.patch("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product: ProductBase,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    updated_product = await user_controller.update_admin_product(product_id, product.dict())
    return updated_product

@admin_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    await verify_admin(user_controller, current_user)
    await user_controller.delete_admin_product(product_id)
    return {"message": "Product deleted successfully"}

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
        # For percentage, ensure we're using discountValue correctly
        coupon_data["discountValue"] = float(coupon_data["discountValue"])
        if "discountPercent" in coupon_data:
            # If discountPercent is provided, use that value instead
            if coupon_data["discountPercent"] is not None:
                coupon_data["discountValue"] = float(coupon_data.pop("discountPercent"))
    else:
        # For fixed amount, just ensure the value is a float
        coupon_data["discountType"] = "fixed"
        coupon_data["discountValue"] = float(coupon_data["discountValue"])
    
    # Convert ISOString to datetime if present
    if coupon.expiresAt and isinstance(coupon.expiresAt, str):
        coupon_data["expiresAt"] = datetime.fromisoformat(coupon.expiresAt.replace('Z', '+00:00'))
    
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
        # Verify admin role
        if not user_controller.has_role(current_user.sub, Role.ADMIN):
            raise UserException(
                "Unauthorized: Admin role required",
                status_code=403
            )
        
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
        
        result = user_controller.db.orders.insert_one(order_dict)
        created_order = user_controller.db.orders.find_one({"_id": result.inserted_id})
        created_order["id"] = str(created_order["_id"])
        
        return created_order
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
