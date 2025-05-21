from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class ProductTag(BaseModel):
    name: Dict[str, str]
    color: Optional[str] = None
    
class ProductTagInDB(ProductTag):
    id: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
