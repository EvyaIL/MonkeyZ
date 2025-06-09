from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional
from src.models.key.key import KeyRespond

class ProductResponse(BaseModel):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: int
    active: bool
    is_new: bool = False
    percent_off: int = 0
    is_best_seller: bool = False



