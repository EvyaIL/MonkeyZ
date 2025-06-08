from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional
from datetime import datetime, timedelta

class Product(Document):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:float  # Changed from int to float to support decimal prices
    # Both naming conventions for compatibility
    best_seller:bool = False
    isBestSeller:bool = False
    active:bool = True
    created_at:datetime = datetime.now()
    createdAt:datetime = datetime.now()
    # Homepage display flags (both naming conventions)
    display_on_homepage:bool = False  # snake_case
    displayOnHomepage:bool = False    # camelCase
    # New product flags (both naming conventions)
    is_new:bool = False  # snake_case
    isNew:bool = False   # camelCase
    # Discount percentage
    discount_percentage:int = 0  # snake_case
    discountPercentage:int = 0   # camelCase
    # Product keys
    keys: dict[PydanticObjectId,PydanticObjectId] = {}

    class Settings:
        name = "products"

class ProductRequest(BaseModel):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:float  # Changed from int to float to support decimal prices
    # Both naming conventions for compatibility
    best_seller:bool = False
    isBestSeller:bool = False
    # Timestamps (both naming conventions)
    created_at:Optional[datetime] = datetime.now()
    createdAt:Optional[datetime] = datetime.now()
    active:bool = True
    # Homepage display flags (both naming conventions)
    display_on_homepage:bool = False
    displayOnHomepage:bool = False
    # New product flags (both naming conventions)
    is_new:bool = False
    isNew:bool = False
    # Discount percentage (both naming conventions)
    discount_percentage:int = 0
    discountPercentage:int = 0


