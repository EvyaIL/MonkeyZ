from pydantic import BaseModel, Field
from typing import Optional

class Coupon(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    code: str
    active: bool
    discountType: str
    discountValue: float
    uses: int = 0
    usageAnalytics: dict = {}  # {"total": 0, "completed": 0, "cancelled": 0, "pending": 0}
    maxUsagePerUser: int = 0  # 0 means unlimited
    userUsages: dict = {}     # {"user@email.com": 2, ...}
