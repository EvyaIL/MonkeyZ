from beanie import Document, Indexed,PydanticObjectId
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional

from src.models.user.user_response import SelfResponse

class Token(BaseModel):
    access_token: str
    token_type:str

class TokenData(BaseModel):
    username: Optional[str] = None
    access_token: str



class LoginResponse(BaseModel):
    access_token: str
    token_type:str
    user:SelfResponse