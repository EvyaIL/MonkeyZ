from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional
from src.models.key.key import KeyResponse # Changed KeyRespond to KeyResponse
from datetime import datetime # Add this import

class ProductResponse(BaseModel):
    id: PydanticObjectId # Add this field
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: int
    active: bool
    created_at: datetime # Add this field
    image: Optional[str] = None
    imageUrl: Optional[str] = None # Add this field
    category: Optional[str] = None # Product category
    is_new: Optional[bool] = False
    percent_off: Optional[int] = 0
    best_seller: bool = False
    displayOnHomePage: bool = False  # New field for homepage display



