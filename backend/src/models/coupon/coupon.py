from pydantic import BaseModel, Field
from typing import Optional

class Coupon(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    code: str
    active: bool
    discountType: str
    discountValue: float
    uses: int = 0
