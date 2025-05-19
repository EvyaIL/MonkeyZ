from beanie import PydanticObjectId
from pydantic import BaseModel

from src.models.key.key import Key
from src.models.user.user import Role

from typing import Optional

class UserResponse(BaseModel):
    id: PydanticObjectId
    username: str  
    role:Role
    
class SelfResponse(BaseModel):
    id: str
    username: str  # Corrected the field name to match your code
    role:Role
    email:str
    phone_number:int
    keys:Optional[dict[PydanticObjectId,Key]] = None 
    
    
    
    
