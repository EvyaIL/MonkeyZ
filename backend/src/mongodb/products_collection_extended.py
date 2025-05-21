from typing import List, Dict, Optional
from ..models.product.product import Product, ProductInDB
from .mongodb import MongoDB
from datetime import datetime

class ProductsCollection:
    def __init__(self):
        self.db = MongoDB().get_db()
        self.collection = self.db.products
        self.keys_collection = self.db.product_keys

    async def get_all_products(self) -> List[ProductInDB]:
        """Get all products from the database"""
        products = await self.collection.find().to_list(length=100)
        return [ProductInDB(**product) for product in products]

    async def get_best_sellers(self) -> List[ProductInDB]:
        """Get all products marked as best sellers"""
        products = await self.collection.find({"is_best_seller": True}).to_list(length=100)
        return [ProductInDB(**product) for product in products]
    
    async def get_new_products(self) -> List[ProductInDB]:
        """Get all products marked as new"""
        products = await self.collection.find({"is_new": True}).to_list(length=100)
        return [ProductInDB(**product) for product in products]

    async def get_product_by_id(self, product_id: str) -> Optional[ProductInDB]:
        """Get a product by its ID"""
        product = await self.collection.find_one({"id": product_id})
        if product:
            return ProductInDB(**product)
        return None

    async def get_products_by_category(self, category: str) -> List[ProductInDB]:
        """Get all products in a specific category"""
        products = await self.collection.find({"category": category}).to_list(length=100)
        return [ProductInDB(**product) for product in products]

    async def get_products_by_tag(self, tag_id: str) -> List[ProductInDB]:
        """Get all products with a specific tag"""
        products = await self.collection.find({"tags": tag_id}).to_list(length=100)
        return [ProductInDB(**product) for product in products]

    async def create_product(self, product_dict: Dict) -> str:
        """Create a new product"""
        await self.collection.insert_one(product_dict)
        return product_dict["id"]

    async def update_product(self, product_id: str, product_dict: Dict) -> bool:
        """Update an existing product"""
        result = await self.collection.update_one(
            {"id": product_id},
            {"$set": product_dict}
        )
        return result.modified_count > 0

    async def delete_product(self, product_id: str) -> bool:
        """Delete a product"""
        result = await self.collection.delete_one({"id": product_id})
        return result.deleted_count > 0

    async def add_product_keys(self, product_id: str, keys: List[str]) -> bool:
        """Add keys to a product (for digital products)"""
        # Store keys in a separate collection for better security
        key_documents = [
            {
                "product_id": product_id,
                "key": key,
                "used": False,
                "created_at": datetime.now().isoformat()
            } for key in keys
        ]
        
        if key_documents:
            await self.keys_collection.insert_many(key_documents)
            
            # Update the stock count
            current_product = await self.get_product_by_id(product_id)
            if current_product:
                new_stock = current_product.stock_count + len(keys)
                await self.update_product(product_id, {"stock_count": new_stock})
                
            return True
        return False

    async def get_product_keys(self, product_id: str, used_only: bool = False) -> List[Dict]:
        """Get all keys for a product"""
        query = {"product_id": product_id}
        if used_only:
            query["used"] = True
            
        keys = await self.keys_collection.find(query).to_list(length=1000)
        return keys
        
    async def use_product_key(self, product_id: str) -> Optional[str]:
        """Get and mark an unused key as used"""
        # Find an unused key
        key_doc = await self.keys_collection.find_one_and_update(
            {"product_id": product_id, "used": False},
            {"$set": {"used": True, "used_at": datetime.now().isoformat()}},
            return_document=True
        )
        
        if key_doc:
            # Decrease stock count
            current_product = await self.get_product_by_id(product_id)
            if current_product and current_product.stock_count > 0:
                await self.update_product(product_id, {"stock_count": current_product.stock_count - 1})
            
            return key_doc["key"]
        
        return None
