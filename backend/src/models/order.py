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
    assigned_key: Optional[str] = Field(None, description="The CD key assigned to this item if applicable")

class StatusHistoryEntry(BaseModel):
    status: str
    date: datetime
    note: Optional[str] = None

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()), alias="_id")
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
    updatedAt: datetime = Field(default_factory=datetime.utcnow) # ADDED
    notes: Optional[str] = None
    coupon_code: Optional[str] = None
    discount_amount: Optional[float] = Field(default=0.0)
    original_total: Optional[float] = None # To store total before discount
    
    class Config:
        allow_population_by_alias = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat() # Ensure datetime is ISO formatted
        }

class OrderStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None

class StatusEnum(str, Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    AWAITING_STOCK = "Awaiting Stock" # Added new status
    FAILED = "Failed" # Added for orders that fail due to no keys after retries or other reasons
