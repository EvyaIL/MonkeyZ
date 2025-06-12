from beanie import Document, PydanticObjectId  # Removed Indexed here, will define in Settings
from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
import pymongo  # Import pymongo for index types if needed later


class KeyStatus(str, Enum):
    AVAILABLE = "available"
    USED = "used"
    RESERVED = "reserved"


class Key(Document):
    key_string: str  # Removed Indexed()
    product_id: PydanticObjectId  # Removed Indexed()
    status: KeyStatus = Field(default=KeyStatus.AVAILABLE)  # Removed Indexed()
    added_date: datetime = Field(default_factory=datetime.utcnow)
    used_date: Optional[datetime] = None
    order_id: Optional[PydanticObjectId] = None  # Removed Indexed()

    class Settings:
        name = "keys"
        indexes = [
            "key_string",
            "product_id",
            "status",
            "order_id",
            # Example for a compound index or unique index if needed later:
            # [("product_id", pymongo.ASCENDING), ("key_string", pymongo.ASCENDING), {"unique": True}],
        ]


class KeyCreateRequest(BaseModel):
    key_string: str
    product_id: PydanticObjectId
    status: Optional[KeyStatus] = KeyStatus.AVAILABLE


class BulkKeyCreateRequest(BaseModel):
    product_id: PydanticObjectId
    key_strings: list[str]
    status: Optional[KeyStatus] = KeyStatus.AVAILABLE


class KeyUpdateRequest(BaseModel):
    status: Optional[KeyStatus] = None
    order_id: Optional[PydanticObjectId] = None


class KeyResponse(BaseModel):
    id: PydanticObjectId = Field(..., alias="_id")
    key_string: str
    product_id: PydanticObjectId
    status: KeyStatus
    added_date: datetime
    used_date: Optional[datetime] = None
    order_id: Optional[PydanticObjectId] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            PydanticObjectId: str,
            datetime: lambda dt: dt.isoformat(),
            KeyStatus: lambda ks: ks.value  # Ensure enum is serialized as its string value
        }