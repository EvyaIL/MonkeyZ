from beanie import Document, PydanticObjectId, Link
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Defines the structure for an individual CD key
class CDKey(BaseModel):
    key: str
    isUsed: bool = Field(default=False)
    usedAt: Optional[datetime] = None
    orderId: Optional[PydanticObjectId] = None # For referencing Order ObjectId
    addedAt: datetime = Field(default_factory=datetime.utcnow)

class CDKeyUpdateRequest(BaseModel):
    key: Optional[str] = None
    isUsed: Optional[bool] = None
    usedAt: Optional[datetime] = None
    orderId: Optional[PydanticObjectId] = None

class CDKeysAddRequest(BaseModel):
    keys: List[CDKey] # Should be List[str] if adding new keys, or List[CDKey] if adding pre-defined CDKey objects. Assuming List[str] for simplicity of adding new keys.
    # If keys are added as strings, they will be converted to CDKey objects in the endpoint.

class Product(Document):
    name: dict  # {\'en\': str, \'he\': str}
    description: dict  # {\'en\': str, \'he\': str}
    price: int # Assuming price is an integer (e.g., cents) or float
    active: bool
    created_at: datetime # Consider default_factory=datetime.utcnow if not always provided
    cdKeys: List[CDKey] = Field(default_factory=list)  # Added new field for CD keys
    manages_cd_keys: bool = Field(default=True) # Ensures this field exists, default True is fine.
    is_new: bool = False  # New product tag
    percent_off: int = 0  # Discount percentage
    best_seller: bool = False  # Best Seller tag
    displayOnHomePage: bool = False  # New field for homepage display
    slug: Optional[str] = None  # Unique URL-friendly identifier
    category: Optional[str] = None # Product category
    imageUrl: Optional[str] = None # Product image URL

    class Settings:
        name = "Product" # Changed from "products" to "Product" to match MongoDB

class AddKeysRequest(BaseModel):
    keys: List[str] # This is good for adding new keys by string value

class ProductRequest(BaseModel):
    name: dict  # {\'en\': str, \'he\': str}
    description: dict  # {\'en\': str, \'he\': str}
    price: int # Match type in Product model
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow) # Changed from datetime.now
    active: bool
    is_new: bool = False
    percent_off: int = 0
    best_seller: bool = False
    displayOnHomePage: bool = False
    slug: Optional[str] = None
    category: Optional[str] = None
    imageUrl: Optional[str] = None


