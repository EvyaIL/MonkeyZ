from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class CouponAnalytics(BaseModel):
    total_orders: int = 0
    completed: int = 0
    cancelled: int = 0
    pending: int = 0
    processing: int = 0
    awaiting_stock: int = 0

class Coupon(BaseModel):
    id: str = Field(..., alias="_id")
    code: str
    discount_type: str = Field(..., alias="discountType")
    discount_value: float = Field(..., alias="discountValue")
    active: bool = True
    expires_at: Optional[datetime] = Field(None, alias="expiresAt")
    max_uses: Optional[int] = Field(None, alias="maxUses")
    usage_count: int = Field(0, alias="usageCount")
    max_usage_per_user: int = Field(0, alias="maxUsagePerUser")
    usage_analytics: CouponAnalytics = Field(default_factory=CouponAnalytics, alias="usageAnalytics")
    user_usages: Dict[str, int] = Field(default_factory=dict, alias="userUsages")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="createdAt")
    updated_at: datetime = Field(default_factory=datetime.utcnow, alias="updatedAt")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            ObjectId: lambda oid: str(oid),
        }
