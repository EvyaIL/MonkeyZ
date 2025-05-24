import os
from beanie import Document, Indexed, init_beanie
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from .mongodb import MongoDb
from src.singleton.singleton import Singleton

class Product(Document):
    name: str
    description: str
    price: float
    imageUrl: str
    active: bool = True
    createdAt: datetime = datetime.utcnow()
    updatedAt: datetime = datetime.utcnow()

    class Settings:
        name = "products"
        indexes = [
            "name",
            ("name", "active"),
            "createdAt",
            "updatedAt"
        ]

class Coupon(Document):
    code: Indexed(str, unique=True)  # type: ignore
    discountPercent: float
    active: bool = True
    expiresAt: Optional[datetime] = None
    maxUses: Optional[int] = None
    usageCount: int = 0
    createdAt: datetime = datetime.utcnow()
    
    class Settings:
        name = "coupons"
        indexes = [
            "code",
            "active",
            "createdAt"
        ]
        
    def model_dump(self, *args, **kwargs):
        """Convert model data to dict, including proper string ID."""
        data = super().model_dump(*args, **kwargs)
        data["id"] = str(self.id)  # Convert ObjectId to string
        return data
        
    def dict(self, *args, **kwargs):
        """Convert model to dict, including proper string ID. (Legacy support)"""
        # Use the direct implementation to avoid circular reference
        try:
            data = super().dict(*args, **kwargs)
        except AttributeError:
            # For Pydantic v2 compatibility if dict() is not available
            data = super().model_dump(*args, **kwargs)
        data["id"] = str(self.id)  # Convert ObjectId to string
        return data

class ProductCollection(MongoDb, metaclass=Singleton):
    async def initialize(self):
        """Initialize database connections and collections."""
        await self.connection()
        # Initialize Beanie with the document models
        client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
        db = client.get_default_database()
        await init_beanie(database=db, document_models=[Product, Coupon])
        
    async def get_all_products(self) -> List[Product]:
        """Get all products."""
        return await Product.find().to_list()

    async def create_product(self, product_data: dict) -> Product:
        """Create a new product."""
        product = Product(**product_data)
        await product.insert()
        return product

    async def update_product(self, product_id: str, product_data: dict) -> Product:
        """Update a product."""
        product = await Product.get(product_id)
        if not product:
            raise ValueError("Product not found")
        
        product_data["updatedAt"] = datetime.utcnow()
        await product.update({"$set": product_data})
        return product

    async def delete_product(self, product_id: str) -> None:
        """Delete a product."""
        product = await Product.get(product_id)
        if not product:
            raise ValueError("Product not found")
        await product.delete()
        
    async def get_all_coupons(self) -> List[dict]:
        """Get all coupons.
        
        Returns:
            List[dict]: List of coupons with properly serialized fields
        """
        coupons = await Coupon.find().to_list()
        return [coupon.dict() for coupon in coupons]

    async def create_coupon(self, coupon_data: dict) -> Coupon:
        """Create a new coupon."""
        # Handle optional fields with defaults
        coupon_dict = {
            "code": coupon_data["code"],
            "discountPercent": float(coupon_data["discountPercent"]),
            "active": coupon_data.get("active", True),
            "createdAt": datetime.utcnow()
        }
        
        # Handle expiresAt separately to avoid type errors
        if coupon_data.get("expiresAt"):
            if isinstance(coupon_data["expiresAt"], str):
                coupon_dict["expiresAt"] = datetime.fromisoformat(coupon_data["expiresAt"].replace('Z', '+00:00'))
            elif isinstance(coupon_data["expiresAt"], datetime):
                coupon_dict["expiresAt"] = coupon_data["expiresAt"]
            else:
                raise ValueError("Invalid expiresAt date format")
        
        # Create and save the coupon
        coupon = Coupon(**coupon_dict)
        await coupon.insert()
        return coupon

    async def update_coupon(self, coupon_id: str, coupon_data: dict) -> Coupon:
        """Update a coupon."""
        coupon = await Coupon.get(coupon_id)
        if not coupon:
            raise ValueError("Coupon not found")

        # Convert data types if necessary
        if "discountPercent" in coupon_data:
            coupon_data["discountPercent"] = float(coupon_data["discountPercent"])
        if "expiresAt" in coupon_data and coupon_data["expiresAt"]:
            coupon_data["expiresAt"] = datetime.fromisoformat(coupon_data["expiresAt"].replace('Z', '+00:00'))
        
        await coupon.update({"$set": coupon_data})
        return coupon

    async def delete_coupon(self, coupon_id: str) -> None:
        """Delete a coupon."""
        coupon = await Coupon.get(coupon_id)
        if not coupon:
            raise ValueError("Coupon not found")
        await coupon.delete()

    async def get_all_orders(self) -> List[Product]:
        """Get all orders.
        
        Returns:
            List[Product]: A list of all orders in the database
        """
        return await Product.find({"type": "order"}).sort(-Product.createdAt).to_list()
