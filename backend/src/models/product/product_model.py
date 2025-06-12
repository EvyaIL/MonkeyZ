
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, Any, List
from datetime import datetime
from bson import ObjectId

class Translation(BaseModel):
    en: Optional[str] = None
    he: Optional[str] = None

class KeyManagement(BaseModel):
    format: Optional[str] = Field(None, description="Regex format for keys, e.g., XXXXX-XXXXX-XXXXX")
    min_stock_alert: Optional[int] = Field(10, description="Minimum stock level before triggering an alert")

class Product(BaseModel):
    id: Optional[ObjectId] = Field(None, alias='_id')
    name: Translation = Field(..., description="Product name in different languages")
    description: Optional[Translation] = Field(None, description="Product description")
    price: float = Field(..., gt=0, description="Product price")
    images: List[HttpUrl] = Field([], description="List of product image URLs")
    categories: List[str] = Field([], description="List of product categories")
    tags: List[str] = Field([], description="List of product tags")
    stock_quantity: Optional[int] = Field(None, description="Overall stock quantity if not using individual keys")
    sku: Optional[str] = Field(None, description="Stock Keeping Unit")
    # active: bool = Field(True, description="Is the product active and visible?")
    # is_featured: bool = Field(False, description="Is the product featured?")
    # weight: Optional[float] = Field(None, description="Product weight")
    # dimensions: Optional[Dict[str, float]] = Field(None, description="Product dimensions (l, w, h)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # New fields for key management
    manages_keys: bool = Field(False, description="Does this product use CD keys for stock?")
    key_management: Optional[KeyManagement] = Field(None, description="Settings for key management")
    # Removed direct keys list here, will be in a separate collection or handled by KeyController

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        allow_population_by_field_name = True

class ProductCreate(BaseModel):
    name: Translation
    description: Optional[Translation] = None
    price: float
    images: Optional[List[HttpUrl]] = []
    categories: Optional[List[str]] = []
    tags: Optional[List[str]] = []
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    manages_keys: Optional[bool] = False
    key_management: Optional[KeyManagement] = None

class ProductUpdate(BaseModel):
    name: Optional[Translation] = None
    description: Optional[Translation] = None
    price: Optional[float] = None
    images: Optional[List[HttpUrl]] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    manages_keys: Optional[bool] = None
    key_management: Optional[KeyManagement] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

