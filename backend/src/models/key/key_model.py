\
from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime
from bson import ObjectId

class KeyModel(BaseModel):
    id: Optional[ObjectId] = Field(None, alias='_id')
    key_string: str = Field(..., description="The actual CD key string")
    product_id: ObjectId = Field(..., description="The ObjectId of the product this key belongs to")
    status: Literal["available", "used", "reserved"] = Field("available", description="Status of the key")
    added_date: datetime = Field(default_factory=datetime.utcnow, description="When the key was added")
    used_date: Optional[datetime] = Field(None, description="When the key was used")
    order_id: Optional[ObjectId] = Field(None, description="ObjectId of the order if the key is used")

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
        allow_population_by_field_name = True
