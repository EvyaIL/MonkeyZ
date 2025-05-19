from beanie import Document, Indexed,PydanticObjectId
from typing import Optional
from pydantic import BaseModel


class Key(Document):
    product: PydanticObjectId
    is_active:bool
    owner:Optional[PydanticObjectId] = None
    key:str

class KeyRequest(BaseModel):
    product: PydanticObjectId
    is_active:bool
    key:str

class KeyRespond (BaseModel):
    id:PydanticObjectId
    product: PydanticObjectId
    is_active:bool
    owner:Optional[PydanticObjectId] = None
    key:str