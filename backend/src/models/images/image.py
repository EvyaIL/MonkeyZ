from beanie import Document, Indexed,PydanticObjectId
from fastapi import UploadFile, File
from pydantic import BaseModel
from typing import Optional

class Image(Document):
    data: bytes
    filename: str
    
    
class ImageRequest(BaseModel):
    id:Optional[PydanticObjectId] = None
    data: bytes
    filename: str
