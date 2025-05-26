from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional
from datetime import datetime, timedelta

class Product(Document):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:int
    best_seller:bool
    active:bool
    created_at:datetime
    display_on_homepage:bool = False  # New field to mark products for homepage display
    is_new:bool = False  # Field to mark product as new
    discount_percentage:int = 0  # Field for discount percentage
    keys: dict[PydanticObjectId,PydanticObjectId] = {}

    class Settings:
        name = "products"

class ProductRequest(BaseModel):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:int
    best_seller:bool
    created_at:Optional[datetime] = datetime.now()
    active:bool
    display_on_homepage:bool = False
    is_new:bool = False
    discount_percentage:int = 0


