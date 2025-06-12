from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional
from enum import Enum
from src.models.key.key import KeyResponse

class Role(Enum):
    manager = 0
    default = 1

class User(Document):
    username: Indexed(str,unique=True) # type: ignore 
    role:Role
    password:str
    email:Indexed(str, unique=True) # type: ignore 
    phone_number: Optional[int] = None # Ensure it is Optional and not indexed for uniqueness if None
    keys:Optional[dict[PydanticObjectId,PydanticObjectId] ] =None

class UserRequest(BaseModel):
    username: str
    password:str
    email:str
    phone_number: Optional[int] = None # Ensure it is Optional



