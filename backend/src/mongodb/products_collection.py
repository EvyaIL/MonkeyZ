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
        print("[DIAGNOSTIC PRINT - ProductsCollection] Initializing...")
        database_name = "shop"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Product])
        print("[DIAGNOSTIC PRINT - ProductsCollection] Initialized.")

    async def get_all_products(self) -> list[Product]:
        print("\n[DIAGNOSTIC PRINT - ProductsCollection] get_all_products CALLED.")
        try:
            collection = Product.get_motor_collection()
            cursor = collection.find({"active": True})  # Only fetch active products
            raw_docs = await cursor.to_list(length=None) # Get all docs at once
            
            print(f"[DIAGNOSTIC PRINT - ProductsCollection] Found {len(raw_docs)} active raw products from DB.")

            products = []
            for i, doc in enumerate(raw_docs):
                doc_id = doc.get('_id', 'N/A_ID')
                raw_doc_name = doc.get('name', 'N/A_NAME')
                doc_name_for_print = str(raw_doc_name.get('en', raw_doc_name)) if isinstance(raw_doc_name, dict) else str(raw_doc_name)
                doc_manages_cd_keys = doc.get('manages_cd_keys', 'N/A_MANAGES_CD_KEYS')
                doc_cd_keys_len = len(doc.get('cdKeys', []))
                doc_image_url = doc.get('imageUrl', 'N/A_IMAGE_URL')
                
                print(
                    f"  [DIAGNOSTIC PRINT - ProductsCollection] Raw doc #{i}: ID={doc_id}, Name='{doc_name_for_print}', "
                    f"ManagesCDKeys_Raw={doc_manages_cd_keys}, NumCDKeys_Raw={doc_cd_keys_len}, ImageUrl_Raw='{doc_image_url}'"
                )

                # Compatibility conversions (existing code)
                if 'createdAt' in doc and 'created_at' not in doc:
                    doc['created_at'] = doc['createdAt']
                if 'updatedAt' in doc and 'updated_at' not in doc:
                    doc['updated_at'] = doc['updatedAt']
                
                current_name = doc.get('name')
                if isinstance(current_name, str):
                    doc['name'] = {'en': current_name, 'he': current_name}
                elif not isinstance(current_name, dict) and current_name is not None:
                    print(f"  [DIAGNOSTIC PRINT - ProductsCollection] WARNING: Doc ID={doc_id} has unexpected type for name: {type(current_name)}.")
                    doc['name'] = {'en': str(current_name), 'he': str(current_name)}
                elif current_name is None:
                    doc['name'] = {'en': 'N/A_NAME_CONVERTED', 'he': 'N/A_NAME_CONVERTED'}

                current_description = doc.get('description')
                if isinstance(current_description, str):
                    doc['description'] = {'en': current_description, 'he': current_description}
                elif not isinstance(current_description, dict) and current_description is not None:
                    print(f"  [DIAGNOSTIC PRINT - ProductsCollection] WARNING: Doc ID={doc_id} has unexpected type for description: {type(current_description)}.")
                    doc['description'] = {'en': str(current_description), 'he': str(current_description)}
                elif current_description is None:
                    doc['description'] = {'en': 'N/A_DESC_CONVERTED', 'he': 'N/A_DESC_CONVERTED'}
                
                try:
                    product = Product(**doc)
                    products.append(product)
                except Exception as e:
                    print(f"  [DIAGNOSTIC PRINT - ProductsCollection] ERROR converting raw doc #{i} (ID={doc_id}) to Product model: {e}. Raw doc snippet: {{'_id': {doc_id}, 'name': {doc.get('name')}, 'manages_cd_keys': {doc.get('manages_cd_keys')}}}")
            
            print(f"[DIAGNOSTIC PRINT - ProductsCollection] Returning {len(products)} Product objects from get_all_products.")
            return products
        except Exception as e:
            print(f"[DIAGNOSTIC PRINT - ProductsCollection] CRITICAL ERROR in get_all_products: {str(e)}")
            import traceback
            traceback.print_exc() # Print full traceback for critical errors
            return []

    async def get_best_sellers(self, limit: int = None) -> list[Product]:
        print("\n[DIAGNOSTIC PRINT - ProductsCollection] get_best_sellers CALLED.")
        try:
            collection = Product.get_motor_collection()
            query = {"best_seller": True, "active": True}
            cursor = collection.find(query)
            if limit:
                cursor = cursor.limit(limit)
            
            raw_docs = await cursor.to_list(length=None)
            print(f"[DIAGNOSTIC PRINT - ProductsCollection] Found {len(raw_docs)} best-seller raw products from DB.")
            products = []
            for i, doc in enumerate(raw_docs):
                doc_id = doc.get('_id', 'N/A_ID')
                raw_doc_name = doc.get('name', 'N/A_NAME')
                doc_name_for_print = str(raw_doc_name.get('en', raw_doc_name)) if isinstance(raw_doc_name, dict) else str(raw_doc_name)
                doc_image_url = doc.get('imageUrl', 'N/A_IMAGE_URL')
                print(f"  [DIAGNOSTIC PRINT - ProductsCollection] Best-seller Raw doc #{i}: ID={doc_id}, Name='{doc_name_for_print}', ImageUrl_Raw='{doc_image_url}'")
                
                if 'createdAt' in doc and 'created_at' not in doc:
                    doc['created_at'] = doc['createdAt']
                if 'updatedAt' in doc and 'updated_at' not in doc:
                    doc['updated_at'] = doc['updatedAt']
                current_name = doc.get('name')
                if isinstance(current_name, str):
                    doc['name'] = {'en': current_name, 'he': current_name}
                elif not isinstance(current_name, dict) and current_name is not None:
                    doc['name'] = {'en': str(current_name), 'he': str(current_name)}
                elif current_name is None:
                    doc['name'] = {'en': 'N/A_NAME_CONVERTED', 'he': 'N/A_NAME_CONVERTED'}
                current_description = doc.get('description')
                if isinstance(current_description, str):
                    doc['description'] = {'en': current_description, 'he': current_description}
                elif not isinstance(current_description, dict) and current_description is not None:
                    doc['description'] = {'en': str(current_description), 'he': str(current_description)}
                elif current_description is None:
                    doc['description'] = {'en': 'N/A_DESC_CONVERTED', 'he': 'N/A_DESC_CONVERTED'}
                try:
                    product = Product(**doc)
                    products.append(product)
                except Exception as e:
                    print(f"  [DIAGNOSTIC PRINT - ProductsCollection] ERROR converting best-seller raw doc #{i} (ID={doc_id}) to Product model: {e}.")
            print(f"[DIAGNOSTIC PRINT - ProductsCollection] Returning {len(products)} Product objects from get_best_sellers.")
            return products
        except Exception as e:
            print(f"[DIAGNOSTIC PRINT - ProductsCollection] CRITICAL ERROR in get_best_sellers: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    async def get_recent_products(self, limit: int) -> list[Product]:
        print("\n[DIAGNOSTIC PRINT - ProductsCollection] get_recent_products CALLED.")
        # ... (rest of the method, can add similar prints if needed)
        return await super().get_recent_products(limit)

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
            
        # Generate a unique slug for the product
        if 'slug' not in data or not data['slug']:
            # Generate slug from English name or first available name
            name_for_slug = ""
            if isinstance(data.get('name'), dict):
                name_for_slug = data['name'].get('en') or next(iter(data['name'].values()), "")
            else:
                name_for_slug = str(data.get('name', ""))
            
            # Generate basic slug
            import re
            from unidecode import unidecode
            if name_for_slug:
                # Replace non-alphanumeric characters and convert to lowercase
                slug_base = unidecode(name_for_slug)  # Convert accented characters to ASCII
                slug_base = re.sub(r'[^\w\s-]', '', slug_base.lower())
                slug_base = re.sub(r'[\s-]+', '-', slug_base).strip('-')
                
                # Add timestamp to ensure uniqueness
                from datetime import datetime
                timestamp = int(datetime.utcnow().timestamp())
                data['slug'] = f"{slug_base}-{timestamp}"
            else:
                # Fallback if no name is provided
                from datetime import datetime
                timestamp = int(datetime.utcnow().timestamp())
                data['slug'] = f"product-{timestamp}"
            
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
            
        # Ensure slug is maintained - if no slug exists, create one
        if not product.slug and ('slug' not in data or not data.get('slug')):
            # Generate slug from English name or first available name
            name_for_slug = ""
            if isinstance(data.get('name', product.name), dict):
                name_dict = data.get('name', product.name)
                name_for_slug = name_dict.get('en') or next(iter(name_dict.values()), "")
            else:
                name_for_slug = str(data.get('name', product.name or ""))
            
            # Generate basic slug
            import re
            from unidecode import unidecode
            if name_for_slug:
                # Replace non-alphanumeric characters and convert to lowercase
                slug_base = unidecode(name_for_slug)  # Convert accented characters to ASCII
                slug_base = re.sub(r'[^\w\s-]', '', slug_base.lower())
                slug_base = re.sub(r'[\s-]+', '-', slug_base).strip('-')
                
                # Add timestamp to ensure uniqueness
                from datetime import datetime
                timestamp = int(datetime.utcnow().timestamp())
                data['slug'] = f"{slug_base}-{timestamp}"
            else:
                # Fallback if no name is provided
                from datetime import datetime
                timestamp = int(datetime.utcnow().timestamp())
                data['slug'] = f"product-{timestamp}"
        
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
