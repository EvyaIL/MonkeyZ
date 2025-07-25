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
    AWAITING_STOCK = "awaiting_stock"
    FAILED = "failed"

def normalize_status(status: str) -> str:
    if not status:
        return StatusEnum.PENDING.value
    s = status.lower().replace(" ", "_")
    if s in (StatusEnum.PENDING.value, StatusEnum.PROCESSING.value, StatusEnum.COMPLETED.value, StatusEnum.CANCELLED.value, StatusEnum.AWAITING_STOCK.value, StatusEnum.FAILED.value):
        return s
    # fallback for legacy/typo statuses
    if s in ("cancel", "canceled"): return StatusEnum.CANCELLED.value
    if s in ("done", "success"): return StatusEnum.COMPLETED.value
    return StatusEnum.PENDING.value
