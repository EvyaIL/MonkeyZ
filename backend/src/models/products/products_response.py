from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional
from src.models.key.key import KeyRespond

class ProductResponse(BaseModel):
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:float  # Changed from int to float to support decimal prices
    active:bool

    

