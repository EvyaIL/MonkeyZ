from beanie import PydanticObjectId
from .mongodb import MongoDb
from src.models.products.products import Product, ProductRequest
from src.models.products.products_exception import CreateError, NotValid ,NotFound
from src.singleton.singleton import Singleton
from datetime import datetime, timedelta

class ProductsCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Products database, implemented as a Singleton.
    """

    async def initialize(self) -> None:
        """
        Initializes the Products Collection with the 'shop' database and Product model.
        """
        database_name = "shop"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Product])

    async def get_all_products(self) -> list[Product]:
        """
        Retrieves all products from the database.

        Returns:
            list[Product]: A list of all ACTIVE products in the database.
        """
        try:
            collection = Product.get_motor_collection()
            cursor = collection.find({"active": True})  # Only fetch active products
            products = []
            
            async for doc in cursor:
                # Convert camelCase to snake_case for Pydantic model
                if 'createdAt' in doc and 'created_at' not in doc:
                    doc['created_at'] = doc['createdAt']
                if 'updatedAt' in doc and 'updated_at' not in doc:
                    doc['updated_at'] = doc['updatedAt']
                # Compatibility: convert string name/description to dict
                if isinstance(doc.get('name'), str):
                    doc['name'] = {'en': doc['name'], 'he': ''}
                if isinstance(doc.get('description'), str):
                    doc['description'] = {'en': doc['description'], 'he': ''}
                # Create product instance
                product = Product(**doc)
                products.append(product)
                
            return products
        except Exception as e:
            print(f"Error in get_all_products: {str(e)}")
            return []

    async def get_best_sellers(self, limit: int = None) -> list[Product]:
        """
            Retrieves all the best sellers products from the database.

            Returns:
                list[Product]: A list of all best sellers products in the database.
        """
        try:
            # Fetch raw data with projection to convert field names
            collection = Product.get_motor_collection()            # Use only best_seller field, as it's now standardized
            query = {"best_seller": True}
            cursor = collection.find(query)
            if limit:
                cursor = cursor.limit(limit)
            products = []
            
            async for doc in cursor:
                # Convert camelCase to snake_case for Pydantic model
                if 'createdAt' in doc and 'created_at' not in doc:
                    doc['created_at'] = doc['createdAt']
                if 'updatedAt' in doc and 'updated_at' not in doc:
                    doc['updated_at'] = doc['updatedAt']
                # Compatibility: convert string name/description to dict
                if isinstance(doc.get('name'), str):
                    doc['name'] = {'en': doc['name'], 'he': ''}
                if isinstance(doc.get('description'), str):
                    doc['description'] = {'en': doc['description'], 'he': ''}
                # Create product instance
                product = Product(**doc)
                products.append(product)
                
            return products
        except Exception as e:
            print(f"Error in get_best_sellers: {str(e)}")
            return []

    async def get_recent_products(self, limit: int) -> list[Product]:
        """
        Retrieves the most recently created products.

        Args:
            limit (int): The number of recent products to retrieve. Defaults to 8.

        Returns:
            list[Product]: A list of recently created products.
        """
        try:
            # Fetch raw data with projection to convert field names
            collection = Product.get_motor_collection()
            # Sort by createdAt (camelCase) or created_at (snake_case), whichever exists
            pipeline = [
                {"$sort": {"createdAt": -1}},  # Try camelCase first
                {"$limit": limit}
            ]
            cursor = collection.aggregate(pipeline)
            products = []
            
            async for doc in cursor:
                # Convert camelCase to snake_case for Pydantic model
                if 'createdAt' in doc and 'created_at' not in doc:
                    doc['created_at'] = doc['createdAt']
                if 'updatedAt' in doc and 'updated_at' not in doc:
                    doc['updated_at'] = doc['updatedAt']
                # Compatibility: convert string name/description to dict
                if isinstance(doc.get('name'), str):
                    doc['name'] = {'en': doc['name'], 'he': ''}
                if isinstance(doc.get('description'), str):
                    doc['description'] = {'en': doc['description'], 'he': ''}
                # Create product instance
                product = Product(**doc)
                products.append(product)
                
            return products
        except Exception as e:
            print(f"Error in get_recent_products: {str(e)}")
            return []
        
    async def create_product(self, product_request: ProductRequest) -> Product:
        """
        Creates a new product in the database.

        Args:
            product_request (ProductRequest): The product request containing product details.

        Returns:
            Product: The created product.

        Raises:
            CreateErorr: If the product name is already in use.
        """
        if await self.get_product_by_name(product_request.name):
            raise CreateError("This name is already in use")
            
        product = self.update_or_create_product(product_request, {})
        await product.save()
        return product
        
    async def edit_product(self, product_id: PydanticObjectId, product_request: ProductRequest) -> Product:
        """
        Edits an existing product in the database.

        Args:
            product_id (PydanticObjectId): The ID of the product to edit.
            product_request (ProductRequest): The product request containing updated product details.

        Returns:
            Product: The edited product.
            
        Raises:
            CreateError: If the new product name is already in use.
        """
        current_product = await self.get_product_by_id(product_id)
        product_by_name = await self.get_product_by_name(product_request.name)
        
        if product_by_name and product_by_name.name == current_product.name:
            raise CreateError("This name is already in use")
        
        product = self.update_or_create_product(product_request, current_product.keys)
        product.id = current_product.id
        await product.save()
        return product
        
    async def add_key_to_product(self, product_id: PydanticObjectId, key_id: PydanticObjectId) -> Product:
        """
        Adds a key to a product.

        Args:
            product_id (PydanticObjectId): The ID of the product.
            key_id (PydanticObjectId): The ID of the key to add.

        Returns:
            Product: The updated product with the new key.
        """
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        try:
            current_product = await self.get_product_by_id(product_id)
            
            # Convert key_id to string for consistent handling
            key_id_str = str(key_id)
            
            # Initialize keys dict if it's None or empty
            if current_product.keys is None:
                current_product.keys = {}
            
            # Add the key to the product's keys dictionary
            current_product.keys[key_id_str] = key_id
            
            # Save the product
            logger.info(f"Saving product {product_id} with key {key_id}")
            await current_product.save()
            
            # Verify the key was added
            updated_product = await self.get_product_by_id(product_id)
            if updated_product.keys is None or key_id_str not in updated_product.keys:
                logger.error(f"Key {key_id} not found in product {product_id} after save")
            else:
                logger.info(f"Key {key_id} successfully added to product {product_id}")
                
            return current_product
        except Exception as e:
            logger.error(f"Error adding key to product: {str(e)}")
            raise e

    def update_or_create_product(self, product_request: ProductRequest, keys: dict[PydanticObjectId, PydanticObjectId]) -> Product:
        """
        Creates or updates a product instance.

        Args:
            product_request (ProductRequest): The product request containing product details.
            keys (dict[PydanticObjectId, PydanticObjectId]): The product keys.

        Returns:
            Product: The created or updated product instance.
        """
        return Product(**product_request, keys=keys)
        
    async def create_product_from_dict(self, product_data: dict) -> Product:
        """
        Creates a new product from a dictionary (typically from admin collection).
        Handles field name conversion between camelCase and snake_case.

        Args:
            product_data (dict): The product data as a dictionary.

        Returns:
            Product: The created product.
        """
        # Create a copy of the dict to avoid modifying the original
        data = product_data.copy()
        
        # Handle field name conversions
        if 'createdAt' in data and 'created_at' not in data:
            data['created_at'] = data['createdAt']
        if 'updatedAt' in data and 'updated_at' not in data:
            data['updated_at'] = data['updatedAt']
            
        # Create and save the product
        product = Product(**data)
        await product.save()
        return product
        
    async def update_product_from_dict(self, product_id: str, product_data: dict) -> Product:
        """
        Updates an existing product using dictionary data.
        Handles field name conversion between camelCase and snake_case.

        Args:
            product_id (str): The ID of the product to update.
            product_data (dict): The updated product data.

        Returns:
            Product: The updated product.
        """
        # Get existing product
        product = await Product.get(product_id)
        if not product:
            raise ValueError("Product not found")
            
        # Create a copy of the dict to avoid modifying the original
        data = product_data.copy()
        
        # Handle field name conversions
        if 'createdAt' in data and 'created_at' not in data:
            data['created_at'] = data['createdAt']
        if 'updatedAt' in data and 'updated_at' not in data:
            data['updated_at'] = data['updatedAt']        # Ensure both camelCase and snake_case are handled for best seller
        # Remove all is_best_seller/isBestSeller logic in update/parse
        # Use only best_seller for all product operations
        # Ensure displayOnHomePage and best_seller are properly converted to boolean values
        if 'displayOnHomePage' in data:
            data['displayOnHomePage'] = bool(data['displayOnHomePage'])
        if 'best_seller' in data:
            data['best_seller'] = bool(data['best_seller'])
        # Update the product
        await product.update({'$set': data})
        return product

    async def get_product_by_name(self, name: str) -> Product:
        """
        Retrieves a product by its name (matches either English or Hebrew name, case-insensitive, trimmed).

        Args:
            name (str): The name of the product to retrieve.

        Returns:
            Product: The product with the given name, or None if not found.
        """
        # Clean up the input name
        name = name.strip()
        # Try to match either English or Hebrew name, case-insensitive
        product = await Product.find_one({
            "$or": [
                {"name.en": {"$regex": f"^{name}$", "$options": "i"}},
                {"name.he": {"$regex": f"^{name}$", "$options": "i"}},
                {"name": {"$regex": f"^{name}$", "$options": "i"}}  # fallback for string name fields
            ]
        })
        if not product:
            raise NotFound(f"not found product with the name: {name}")
        return product

    async def get_product_by_id(self, product_id: PydanticObjectId) -> Product:
        """
        Retrieves a product by its ID.

        Args:
            product_id (PydanticObjectId): The ID of the product to retrieve.

        Returns:
            Product: The product with the given ID, or None if not found.
        """
        return await Product.find_one(Product.id == product_id)

    async def delete_product(self, product_id: PydanticObjectId):
        """
        Deletes a product from the database and removes all associated keys.

        Args:
            product_id (PydanticObjectId): The ID of the product to delete.

        Returns:
            str: The deleted product's ID.
        """
        product: Product = await self.get_product_by_id(product_id)
        if not product:
            raise NotFound(f"Product with id {product_id} not found.")
        # Remove all keys associated with this product (if you want cascading delete)
        # Example: await self.delete_keys_by_product(product_id)
        await product.delete()
        return str(product.id)
    
    async def get_product_with_key_count(self, product_id: PydanticObjectId) -> dict:
        """
        Gets a product by its ID and adds a count of its keys.

        Args:
            product_id (PydanticObjectId): The ID of the product.

        Returns:
            dict: The product with an additional field for key count.
        """
        product = await self.get_product_by_id(product_id)
        if not product:
            return None
        
        product_dict = product.dict()
        
        # Add key count
        if product.keys and isinstance(product.keys, dict):
            product_dict["availableKeys"] = len(product.keys)
        else:
            product_dict["availableKeys"] = 0
            
        return product_dict
        
    async def get_all_products_with_key_counts(self) -> list:
        """
        Gets all products and adds a count of keys to each one.

        Returns:
            list: All products with an additional field for key count.
        """
        products = await self.get_all_products()
        products_with_counts = []
        
        for product in products:
            product_dict = product.dict()
              # Add key count
            if product.keys and isinstance(product.keys, dict):
                product_dict["availableKeys"] = len(product.keys)
            else:
                product_dict["availableKeys"] = 0
            products_with_counts.append(product_dict)
        
        return products_with_counts

    async def get_homepage_products(self, limit: int = None) -> list[Product]:
        """
        Retrieves all products marked for homepage display.
        
        Args:
            limit (int, optional): Maximum number of products to return.
                                
        Returns:
            list[Product]: A list of products with displayOnHomePage=True
        """
        try:
            collection = Product.get_motor_collection()
            cursor = collection.find({"displayOnHomePage": True, "active": True})
            if limit:
                cursor = cursor.limit(limit)
            products = []
            async for doc in cursor:
                # Convert camelCase to snake_case for Pydantic model
                if 'createdAt' in doc and 'created_at' not in doc:
                    doc['created_at'] = doc['createdAt']
                if 'updatedAt' in doc and 'updated_at' not in doc:
                    doc['updated_at'] = doc['updatedAt']
                # Compatibility: convert string name/description to dict
                if isinstance(doc.get('name'), str):
                    doc['name'] = {'en': doc['name'], 'he': ''}
                if isinstance(doc.get('description'), str):
                    doc['description'] = {'en': doc['description'], 'he': ''}
                # Create product instance
                product = Product(**doc)
                products.append(product)
            return products
        except Exception as e:
            print(f"Error in get_homepage_products: {str(e)}")
            return []
