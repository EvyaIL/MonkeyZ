from beanie import Document, PydanticObjectId
from pymongo.database import Database
from .mongodb import MongoDb
from src.models.products.products import Product, CDKey, CDKeyUpdateRequest
from src.singleton.singleton import Singleton
from typing import List, Dict, Any, Optional
from datetime import datetime
import pymongo
import logging

class ProductCollection(MongoDb, metaclass=Singleton):
    """Collection for managing shop products."""
    
    async def initialize(self):
        """Initialize the collection with the shop database."""
        database_name = "shop"  # Ensure this is 'shop'
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Product]) # Ensure Product model is used
        
    async def add_keys_to_product(self, product_id: PydanticObjectId, keys: List[str]) -> Product:
        """Add a list of CD keys to a specific product."""
        product = await Product.get(product_id)
        
        if not product:
            raise ValueError(f"Product with id {product_id} not found")
        
        if not product.manages_cd_keys:
            raise ValueError(f"Product {product.name} does not manage CD keys.")
        
        new_cd_keys = []
        for key_string in keys:
            new_key = CDKey(
                key=key_string,
                isUsed=False,
                addedAt=datetime.utcnow()
            )
            new_cd_keys.append(new_key)
        
        if not product.cdKeys:
            product.cdKeys = []
        
        product.cdKeys.extend(new_cd_keys)
        await product.save()
        return product

    async def update_cd_key_in_product(self, product_id: PydanticObjectId, cd_key_index: int, update_data: Dict[str, Any]) -> Product: # Changed type hint
        """Update a specific CD key in a product by its index."""
        product = await Product.get(product_id)
        if not product:
            raise ValueError(f"Product with id {product_id} not found")

        if not product.manages_cd_keys:
            raise ValueError(f"Product {product.name} does not manage CD keys.")

        if not product.cdKeys or cd_key_index < 0 or cd_key_index >= len(product.cdKeys):
            raise ValueError(f"CD key at index {cd_key_index} not found in product {product_id}")

        cd_key_to_update = product.cdKeys[cd_key_index]
        # update_data is already a dict, no need to call model_dump()
        # update_data = cd_key_update_request.model_dump(exclude_unset=True) 

        # Ensure that the 'key' field itself is not being updated through this method.
        # This method should only update status fields like isUsed, usedAt, orderId.
        if 'key' in update_data:
            # Log or handle this case, for now, we'll prevent the key string from being changed.
            print(f"Warning: Attempt to update 'key' string in update_cd_key_in_product was ignored. Key: {update_data['key']}")
            del update_data['key']

        for field_name, value in update_data.items():
            if hasattr(cd_key_to_update, field_name):
                setattr(cd_key_to_update, field_name, value)
            else:
                # Optionally log a warning if trying to set a non-existent attribute
                print(f"Warning: Attribute '{field_name}' does not exist on CDKey model.")
        
        await product.save()
        return product

    async def delete_cd_key_from_product(self, product_id: PydanticObjectId, cd_key_index: int) -> Product:
        """Delete a specific CD key from a product by its index."""
        product = await Product.get(product_id)
        if not product:
            raise ValueError(f"Product with id {product_id} not found")

        if not product.manages_cd_keys:
            raise ValueError(f"Product {product.name} does not manage CD keys.")

        if not product.cdKeys or cd_key_index < 0 or cd_key_index >= len(product.cdKeys):
            raise ValueError(f"CD key at index {cd_key_index} not found in product {product_id}")

        del product.cdKeys[cd_key_index]
        await product.save()
        return product
        
    async def get_all_products(self) -> List[Product]:
        """Get all products in the collection."""
        return await Product.find().to_list()
        
    async def create_product(self, product_data: dict) -> Product:
        """Create a new product."""
        # Convert timestamp fields if needed
        if 'createdAt' in product_data and 'created_at' not in product_data:
            product_data['created_at'] = product_data['createdAt']
        if 'updatedAt' in product_data and 'updated_at' not in product_data:
            product_data['updated_at'] = product_data['updatedAt']
            
        # Ensure imageUrl is present
        if 'imageUrl' in product_data and 'image' not in product_data:
            product_data['image'] = product_data['imageUrl']
            
        # Ensure boolean fields are properly converted
        if 'displayOnHomePage' in product_data:
            product_data['displayOnHomePage'] = bool(product_data['displayOnHomePage'])
        if 'best_seller' in product_data:
            product_data['best_seller'] = bool(product_data['best_seller'])
            
        # Set timestamps if missing
        if 'created_at' not in product_data:
            product_data['created_at'] = datetime.utcnow()
        if 'updated_at' not in product_data:
            product_data['updated_at'] = datetime.utcnow()
        
        # Generate a unique slug for the product
        if 'slug' not in product_data or not product_data['slug']:
            # Generate slug from English name or first available name
            name_for_slug = ""
            if isinstance(product_data.get('name'), dict):
                name_for_slug = product_data['name'].get('en') or next(iter(product_data['name'].values()), "")
            else:
                name_for_slug = str(product_data.get('name', ""))
            
            # Generate basic slug
            import re
            from unidecode import unidecode
            if name_for_slug:
                # Replace non-alphanumeric characters and convert to lowercase
                slug_base = unidecode(name_for_slug)  # Convert accented characters to ASCII
                slug_base = re.sub(r'[^\w\s-]', '', slug_base.lower())
                slug_base = re.sub(r'[\s-]+', '-', slug_base).strip('-')
                
                # Add timestamp to ensure uniqueness
                timestamp = int(datetime.utcnow().timestamp())
                product_data['slug'] = f"{slug_base}-{timestamp}"
            else:
                # Fallback if no name is provided
                timestamp = int(datetime.utcnow().timestamp())
                product_data['slug'] = f"product-{timestamp}"
            
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
            
        # Ensure slug is maintained - if no slug exists, create one
        if not product.slug and ('slug' not in product_data or not product_data.get('slug')):
            # Generate slug from English name or first available name
            name_for_slug = ""
            product_name = product_data.get('name', product.name)
            if isinstance(product_name, dict):
                name_for_slug = product_name.get('en') or next(iter(product_name.values()), "")
            else:
                name_for_slug = str(product_name or "")
            
            # Generate basic slug
            import re
            from unidecode import unidecode
            if name_for_slug:
                # Replace non-alphanumeric characters and convert to lowercase
                slug_base = unidecode(name_for_slug)  # Convert accented characters to ASCII
                slug_base = re.sub(r'[^\w\s-]', '', slug_base.lower())
                slug_base = re.sub(r'[\s-]+', '-', slug_base).strip('-')
                
                # Add timestamp to ensure uniqueness
                timestamp = int(datetime.utcnow().timestamp())
                product_data['slug'] = f"{slug_base}-{timestamp}"
            else:
                # Fallback if no name is provided
                timestamp = int(datetime.utcnow().timestamp())
                product_data['slug'] = f"product-{timestamp}"
        
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

    async def get_best_sellers(self, limit: int = 10) -> List[Product]:
        """Get best-selling products from the shop.Product collection."""
        # Assumes 'best_seller' is a boolean field in the Product model.
        # You might also want to sort by a sales metric if available, or by creation date as a fallback.
        return await Product.find({"best_seller": True}).sort(-Product.created_at).limit(limit).to_list()

    async def get_homepage_products(self, limit: int = 10) -> List[Product]:
        """Get products to display on the homepage from the shop.Product collection."""
        # Assumes 'displayOnHomePage' is a boolean field in the Product model.
        return await Product.find({"displayOnHomePage": True}).sort(-Product.created_at).limit(limit).to_list()

    async def get_recent_products(self, limit: int = 10) -> List[Product]:
        """Get recently added products from the shop.Product collection."""
        return await Product.find().sort(-Product.created_at).limit(limit).to_list()

    async def get_product_by_slug(self, slug: str) -> Optional[Product]:
        """Get a single product by its slug from the shop.Product collection."""
        return await Product.find_one({Product.slug: slug})
