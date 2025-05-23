from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional, List, Dict
from datetime import datetime, timedelta

class DigitalCode(BaseModel):
    code: str
    activation_url: Optional[str]
    is_used: bool = False
    used_by: Optional[str] = None
    used_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class Product(Document):
    name: Indexed(str, unique=True) # type: ignore 
    description: str
    price: int
    best_seller: bool
    active: bool = True
    created_at: datetime
    digital_codes: Dict[str, DigitalCode] = {}  # Map of code ID to DigitalCode
    stock_threshold: int = 5  # Alert when stock falls below this number
    auto_assign_codes: bool = True  # Whether to automatically assign codes on purchase
    code_prefix: Optional[str] = None  # Optional prefix for generated codes
    expiry_days: Optional[int] = None  # Days until code expires after purchase

class ProductRequest(BaseModel):
    name: Indexed(str, unique=True) # type: ignore 
    description: str
    price: int
    best_seller: bool
    created_at: Optional[datetime] = datetime.now()
    active: bool
    stock_threshold: Optional[int] = 5
    auto_assign_codes: Optional[bool] = True
    code_prefix: Optional[str] = None
    expiry_days: Optional[int] = None


