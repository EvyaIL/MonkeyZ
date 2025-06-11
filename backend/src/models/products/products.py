from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional
from datetime import datetime, timedelta

class Product(Document):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: int
    active: bool
    created_at: datetime
    keys: dict[PydanticObjectId, PydanticObjectId] = {}
    is_new: bool = False  # New product tag
    percent_off: int = 0  # Discount percentage
    best_seller: bool = False  # Best Seller tag
    displayOnHomePage: bool = False  # New field for homepage display
    slug: Optional[str] = None  # Unique URL-friendly identifier
    category: Optional[str] = None # Product category

class ProductRequest(BaseModel):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: int
    created_at: Optional[datetime] = Field(default_factory=datetime.now)
    active: bool
    is_new: bool = False
    percent_off: int = 0
    best_seller: bool = False
    displayOnHomePage: bool = False  # New field for homepage display
    slug: Optional[str] = None  # Unique URL-friendly identifier
    category: Optional[str] = None # Product category


