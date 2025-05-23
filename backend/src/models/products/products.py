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
    keys: dict[PydanticObjectId,PydanticObjectId]

class ProductRequest(BaseModel):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:int
    best_seller:bool
    created_at:Optional[datetime] = datetime.now()
    active:bool


