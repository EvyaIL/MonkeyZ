from beanie import Document, PydanticObjectId
from pymongo.database import Database
from .mongodb import MongoDb
from src.models.products.products import Product
from src.singleton.singleton import Singleton
from typing import List, Optional, Union, Dict, Any
from datetime import datetime
import pymongo
import logging

class ProductCollection(MongoDb, metaclass=Singleton):
    """Collection for managing admin products."""
    
    async def initialize(self):
        """Initialize the collection with the admin database."""
        database_name = "admin"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Product])
        
    async def get_all_products(self) -> List[Product]:
        """Get all products in the collection."""
        return await Product.find().to_list()
        
    async def create_product(self, product_data: dict) -> Product:
        """Create a new product."""
        product = Product(**product_data)
        await product.save()
        return product
        
    async def get_product(self, product_id: str) -> Product:
        """Get a product by ID."""
        return await Product.get(product_id)
        
    async def update_product(self, product_id: str, product_data: dict) -> Product:
        """Update a product."""
        product = await Product.get(product_id)
        if not product:
            raise ValueError("Product not found")
        product_data["updatedAt"] = datetime.utcnow()
        # Ensure both camelCase and snake_case are handled
        if "displayOnHomePage" in product_data:
            product_data["displayOnHomePage"] = bool(product_data["displayOnHomePage"])
        if "best_seller" in product_data:
            product_data["best_seller"] = bool(product_data["best_seller"])
        await product.update({"$set": product_data})
        return product
        
    async def delete_product(self, product_id: str):
        """Delete a product."""
        product = await Product.get(product_id)
        if not product:
            raise ValueError("Product not found")
        await product.delete()
        return {"message": "Product deleted"}

    async def get_product_by_id(self, product_id: str) -> Product:
        """Get a product by ID."""
        return await Product.get(product_id)
        
    # Coupon related methods
    async def create_coupon(self, coupon_data: dict):
        """Create a new coupon."""
        collection = self.db.get_collection("coupons")
        coupon_data["createdAt"] = datetime.utcnow()
        result = await collection.insert_one(coupon_data)
        return {"id": str(result.inserted_id), **coupon_data}
        
    async def get_all_coupons(self):
        """Get all coupons."""
        collection = self.db.get_collection("coupons")
        coupons = []
        cursor = collection.find({})
        async for coupon in cursor:
            coupon["id"] = str(coupon.pop("_id"))
            coupons.append(coupon)
        return coupons
        
    async def update_coupon(self, coupon_id: str, coupon_data: dict):
        """Update a coupon."""
        from bson.objectid import ObjectId
        try:
            coupon_object_id = ObjectId(coupon_id)
        except:
            raise ValueError("Invalid coupon ID format")
            
        collection = self.db.get_collection("coupons")
        await collection.update_one({"_id": coupon_object_id}, {"$set": coupon_data})
        
        # Get the updated coupon
        updated_coupon = await collection.find_one({"_id": coupon_object_id})
        if updated_coupon:
            updated_coupon["id"] = str(updated_coupon.pop("_id"))
        return updated_coupon
        
    async def delete_coupon(self, coupon_id: str):
        """Delete a coupon."""
        from bson.objectid import ObjectId
        try:
            coupon_object_id = ObjectId(coupon_id)
        except:
            raise ValueError("Invalid coupon ID format")
            
        collection = self.db.get_collection("coupons")
        result = await collection.delete_one({"_id": coupon_object_id})
        
        if result.deleted_count == 0:
            raise ValueError("Coupon not found")
            
        return {"message": "Coupon deleted successfully"}
