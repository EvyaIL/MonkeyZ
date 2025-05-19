from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional, Union
from datetime import datetime, timedelta

from src.models.images.image import ImageRequest

class Product(Document):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:int
    best_seller:bool
    active:bool
    created_at:Optional[datetime] = datetime.now()
    keys: dict[PydanticObjectId,PydanticObjectId]
    stock:int = 0
    image:Optional[ PydanticObjectId] = None
    
class ProductRequest(BaseModel):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:int
    best_seller:bool
    active:bool
    image:Union[PydanticObjectId,ImageRequest]



