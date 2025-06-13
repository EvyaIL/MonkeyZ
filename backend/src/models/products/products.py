from beanie import Document, PydanticObjectId, Link
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
import logging # Added for model-specific logging

# Get a logger for this module (e.g., "src.models.products.products")
model_logger = logging.getLogger(__name__)

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
    keys: List[CDKey]

class Product(Document):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: int # Assuming price is an integer (e.g., cents) or float
    active: bool
    created_at: datetime # Consider default_factory=datetime.utcnow if not always provided
    cdKeys: List[CDKey] = Field(default_factory=list)  # Added new field for CD keys
    manages_cd_keys: bool = Field(default=False) # New field
    is_new: bool = False  # New product tag
    percent_off: int = 0  # Discount percentage
    best_seller: bool = False  # Best Seller tag
    displayOnHomePage: bool = False  # New field for homepage display
    slug: Optional[str] = None  # Unique URL-friendly identifier
    category: Optional[str] = None # Product category
    imageUrl: Optional[str] = None # Product image URL

    @validator("imageUrl", pre=True, always=True)
    def validate_image_url(cls, v, values):
        # Attempt to get a product identifier for logging.
        # 'id' might not be in 'values' during initial creation from raw data before an ID is assigned.
        # 'name' itself could also be complex or not yet validated.
        product_name_dict = values.get('name')
        product_identifier_for_log = "Unknown Product"
        if isinstance(product_name_dict, dict):
            product_identifier_for_log = product_name_dict.get('en', str(product_name_dict))
        elif product_name_dict is not None: # If name is somehow not a dict but present
            product_identifier_for_log = str(product_name_dict)

        if v is None:
            # This is fine, imageUrl is Optional. No log needed unless for verbose debugging.
            return None
        
        if isinstance(v, str):
            if not v.strip(): # If it's an empty string or only whitespace
                model_logger.info(f"Product '{product_identifier_for_log}': imageUrl was empty/whitespace, converting to None.")
                return None
            # Here you could add more validation, e.g., if it's a valid URL format
            return v # It's a non-empty string
        else:
            # The value for imageUrl is present but not a string.
            model_logger.warning(
                f"Product '{product_identifier_for_log}': imageUrl was not a string (type: {type(v)}, value: '{str(v)[:100]}'). Converting to None."
            )
            return None

    class Settings:
        name = "Product" # Changed from "products" to "Product" to match MongoDB

class AddKeysRequest(BaseModel):
    keys: List[str]

class ProductRequest(BaseModel):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
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


