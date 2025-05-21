from pydantic import BaseModel
from typing import Optional, List, Dict

class ProductTag(BaseModel):
    name: Dict[str, str]  # Localized tag names (e.g., {"en": "Electronics", "he": "אלקטרוניקה"})
    color: Optional[str] = None  # Optional hex color code for the tag
    
class Product(BaseModel):
    name: Dict[str, str]
    description: Dict[str, str]
    category: str
    price: float
    image: Optional[str] = None
    is_best_seller: bool = False
    is_new: bool = False
    discount_percentage: Optional[float] = 0
    stock_count: int = 0
    tags: List[str] = []  # List of tag IDs
    
class ProductInDB(Product):
    id: str
    created_at: str
    updated_at: str
