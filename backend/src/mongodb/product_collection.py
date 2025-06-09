import os
from beanie import Document, Indexed, init_beanie
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from .mongodb import MongoDb
from src.singleton.singleton import Singleton

class TranslationContent(BaseModel):
    en: Optional[str] = None
    he: Optional[str] = None

class ProductTranslations(BaseModel):
    name: Optional[TranslationContent] = None
    description: Optional[TranslationContent] = None

class ProductMetadata(BaseModel):
    translations: Optional[ProductTranslations] = None

class Product(Document):
    name: dict  # {'en': str, 'he': str}
    description: dict  # {'en': str, 'he': str}
    price: float
    imageUrl: str
    active: bool = True
    category: Optional[str] = None
    metadata: Optional[ProductMetadata] = None
    createdAt: datetime = datetime.utcnow()
    updatedAt: datetime = datetime.utcnow()

    class Settings:
        name = "products"
        indexes = [
            "name",
            ("name", "active"),
            "createdAt",
            "updatedAt",
            "category"
        ]

    def get_translated_name(self, lang: str = 'en') -> str:
        if not self.metadata or not self.metadata.translations or not self.metadata.translations.name:
            return self.name
        return getattr(self.metadata.translations.name, lang) or self.name

    def get_translated_description(self, lang: str = 'en') -> str:
        if not self.metadata or not self.metadata.translations or not self.metadata.translations.description:
            return self.description
        return getattr(self.metadata.translations.description, lang) or self.description

class Coupon(Document):
    code: Indexed(str, unique=True)  # type: ignore
    discountType: str = "percentage"  # "percentage" or "fixed"
    discountValue: float
    active: bool = True
    expiresAt: Optional[datetime] = None
    maxUses: Optional[int] = None
    usageCount: int = 0
    createdAt: datetime = datetime.utcnow()

    class Settings:
        name = "coupons"
        indexes = [
            "code",
            ("active", "createdAt"),  # Compound index for common query pattern
            ("code", "active"),       # Compound index for lookups
            "createdAt"
        ]
        
    def model_dump(self, *args, **kwargs):
        """Convert model data to dict, including proper string ID."""
        data = super().model_dump(*args, **kwargs)
        # Always ensure id is converted to string
        if hasattr(self, 'id'):
            data["id"] = str(self.id)
        return data
        
    def dict(self, *args, **kwargs):
        """Convert model to dict, including proper string ID. (Legacy support)"""
        try:
            data = super().dict(*args, **kwargs)
        except AttributeError:
            # For Pydantic v2 compatibility if dict() is not available
            data = self.model_dump(*args, **kwargs)
        # Always ensure id is converted to string
        if hasattr(self, 'id'):
            data["id"] = str(self.id)
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
        try:
            # Use projection to only fetch needed fields and optimize query
            coupons = await Coupon.find().sort([("createdAt", -1)]).to_list()
            return [coupon.dict() for coupon in coupons]  # Use built-in dict() method
        except Exception as e:
            # Fallback to raw query only if needed
            db = Coupon.get_motor_collection().database
            collection = db.get_collection("coupons")
            
            # Use aggregation pipeline for better performance
            pipeline = [
                {"$project": {
                    "id": {"$toString": "$_id"},
                    "code": 1,
                    "discountType": {"$ifNull": ["$discountType", "percentage"]},
                    "discountValue": {"$ifNull": ["$discountValue", 0.0]},
                    "active": {"$ifNull": ["$active", False]},
                    "usageCount": {"$ifNull": ["$usageCount", 0]},
                    "expiresAt": 1,
                    "maxUses": 1,
                    "createdAt": 1
                }},
                {"$sort": {"createdAt": -1}}            ]
            
            raw_coupons = await collection.aggregate(pipeline).to_list(length=None)
            
            # Process raw coupons into final result
            result = []
            for raw_coupon in raw_coupons:
                if "active" not in raw_coupon:
                    raw_coupon["active"] = False
                if "usageCount" not in raw_coupon:
                    raw_coupon["usageCount"] = 0
                result.append(raw_coupon)
            
            return result
            
    def _serialize_coupon(self, coupon) -> dict:
        """Helper method to properly serialize a coupon document.
        
        Args:
            coupon: The coupon document to serialize
            
        Returns:
            dict: A properly serialized coupon dictionary
        """        # Use proper serialization method based on what's available
        if hasattr(coupon, 'dict'):
            data = coupon.dict()
        elif hasattr(coupon, 'model_dump'):
            data = coupon.model_dump()
        else:
            data = dict(coupon)
            
        # Ensure ObjectId is properly converted to string
        if hasattr(coupon, 'id'):
            from bson.objectid import ObjectId
            if isinstance(coupon.id, ObjectId):
                data["id"] = str(coupon.id)
            
        return data
    
    async def create_coupon(self, coupon_data: dict) -> Coupon:
        """Create a new coupon."""
        # Handle optional fields with defaults
        coupon_dict = {
            "code": coupon_data["code"],
            "discountType": coupon_data.get("discountType", "percentage"),
            "discountValue": float(coupon_data["discountValue"]),
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
        if "discountValue" in coupon_data:
            coupon_data["discountValue"] = float(coupon_data["discountValue"])
        if "expiresAt" in coupon_data and coupon_data["expiresAt"]:
            if isinstance(coupon_data["expiresAt"], str):
                coupon_data["expiresAt"] = datetime.fromisoformat(coupon_data["expiresAt"].replace('Z', '+00:00'))
        
        await coupon.update({"$set": coupon_data})
        return coupon
        
    async def delete_coupon(self, coupon_id: str) -> None:
        """Delete a coupon."""
        try:
            coupon = await Coupon.get(coupon_id)
            if not coupon:
                raise ValueError("Coupon not found")
            await coupon.delete()
        except Exception as e:
            # Handle validation errors by using raw MongoDB operations
            db = Coupon.get_motor_collection().database
            collection = db.get_collection("coupons")
            # Convert string ID to ObjectId
            from bson.objectid import ObjectId
            try:
                obj_id = ObjectId(coupon_id)
                result = await collection.delete_one({"_id": obj_id})
                if result.deleted_count == 0:
                    raise ValueError("Coupon not found")
            except Exception:
                raise ValueError("Invalid coupon ID or coupon not found")

    async def get_all_orders(self) -> List[Product]:
        """Get all orders.
        
        Returns:
            List[Product]: A list of all orders in the database
        """
        return await Product.find({"type": "order"}).sort(-Product.createdAt).to_list()
