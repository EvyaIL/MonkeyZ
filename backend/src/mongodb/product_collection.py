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
    expiresAt: datetime
    createdAt: datetime = datetime.utcnow()

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

    async def get_all_coupons(self) -> List[Coupon]:
        """Get all coupons."""
        return await Coupon.find().to_list()

    async def create_coupon(self, coupon_data: dict) -> Coupon:
        """Create a new coupon."""
        coupon = Coupon(**coupon_data)
        await coupon.insert()
        return coupon

    async def update_coupon(self, coupon_id: str, coupon_data: dict) -> Coupon:
        """Update a coupon."""
        coupon = await Coupon.get(coupon_id)
        if not coupon:
            raise ValueError("Coupon not found")
        
        await coupon.update({"$set": coupon_data})
        return coupon

    async def delete_coupon(self, coupon_id: str) -> None:
        """Delete a coupon."""
        coupon = await Coupon.get(coupon_id)
        if not coupon:
            raise ValueError("Coupon not found")
        await coupon.delete()
