from beanie import Document, PydanticObjectId
from datetime import datetime
from typing import List, Dict
from pydantic import BaseModel, Field

class ProductSales(BaseModel):
    product_id:PydanticObjectId
    count:int
    price_at_buy_time:float

class Sale(Document):
    user: PydanticObjectId
    products: Dict[PydanticObjectId, ProductSales] 
    total_price: int
    created_at: datetime 
    
class SaleRequest(BaseModel):
    user: PydanticObjectId
    products: Dict[PydanticObjectId, ProductSales] 
    total_price: int
    created_at: datetime = Field(default_factory=datetime.utcnow)