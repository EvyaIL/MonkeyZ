from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class OrderItem(BaseModel):
    productId: str
    name: str
    quantity: int
    price: float
    assigned_keys: Optional[List[str]] = Field(default_factory=list, description="The CD keys assigned to this item if applicable")
    fulfillment_status: Optional[dict] = Field(default=None, description="Tracks assigned/pending quantities for partial fulfillment")

class StatusHistoryEntry(BaseModel):
    status: str
    date: datetime
    note: Optional[str] = None

class Order(BaseModel):
    id: Optional[str] = Field(None, alias="_id")  # Do NOT generate a new ObjectId by default!
    user_id: Optional[str] = None
    customerName: str
    email: str
    phone: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow) 
    status: str = "Pending"
    total: float
    items: List[OrderItem]
    statusHistory: List[StatusHistoryEntry] = Field(default_factory=list)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    coupon_code: Optional[str] = Field(default=None, alias="couponCode")
    discount_amount: Optional[float] = Field(default=0.0, alias="discountAmount")
    original_total: Optional[float] = Field(default=None, alias="originalTotal")
    
    class Config:
        allow_population_by_alias = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

class OrderStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None

class StatusEnum(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    AWAITING_STOCK = "awaiting_stock"
    PARTIALLY_FULFILLED = "partially_fulfilled"

def normalize_status(status: str) -> str:
    """Normalizes a status string to a valid StatusEnum value or a default."""
    if not isinstance(status, str):
        return StatusEnum.PENDING.value # Default for non-string inputs
    
    s = status.lower().replace(" ", "_")
    
    # Direct mapping for common variations
    if s in ["completed", "delivered", "shipped"]:
        return StatusEnum.COMPLETED.value
    if s in ["cancelled", "canceled"]:
        return StatusEnum.CANCELLED.value
    if s in ["awaiting_stock", "backordered", "out_of_stock"]:
        return StatusEnum.AWAITING_STOCK.value
    if s in ["partially_fulfilled", "partial", "partial_delivery"]:
        return StatusEnum.PARTIALLY_FULFILLED.value
    
    # Fallback to enum members
    for member in StatusEnum:
        if s == member.value:
            return member.value
            
    return StatusEnum.PENDING.value # Default for unknown statuses
