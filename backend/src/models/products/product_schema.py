from typing import Optional, Dict, Union
from pydantic import BaseModel, Field
from datetime import datetime

class LocalizedText(BaseModel):
    en: str
    he: str

class ProductBase(BaseModel):
    name: Union[Dict[str, str], str]  # Support both localized {en: str, he: str} and string
    description: Union[Dict[str, str], str]
    price: float = Field(..., ge=0)
    image: str
    category: Optional[str] = None
    discountPercentage: Optional[float] = Field(0, ge=0, le=100)
    isNew: Optional[bool] = False
    best_seller: Optional[bool] = False
    inStock: Optional[bool] = True
    digital_codes: Optional[list[str]] = []
    metadata: Optional[dict] = {}
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    name: Optional[Union[Dict[str, str], str]] = None
    description: Optional[Union[Dict[str, str], str]] = None
    price: Optional[float] = None
    image: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    class Config:
        from_attributes = True
