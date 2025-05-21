from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class Product(BaseModel):
    name: Dict[str, str]  # {en: "English Name", he: "Hebrew Name"}
    description: Dict[str, str]  # {en: "English Description", he: "Hebrew Description"}
    category: str
    price: float
    image: Optional[str] = None
    is_best_seller: bool = False
    is_new: bool = False
    discount_percentage: Optional[int] = None
    stock_count: int = 0
    keys: List[str] = []  # List of digital keys
    likes: List[str] = []  # List of user IDs who liked this product

class ProductInDB(Product):
    product_id: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
