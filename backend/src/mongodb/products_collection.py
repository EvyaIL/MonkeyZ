from beanie import PydanticObjectId, Document
from pydantic import ValidationError
import logging
import copy
from .mongodb import MongoDb
from src.models.products.products import Product, ProductRequest, CDKeyUpdateRequest # Added CDKeyUpdateRequest
from src.models.products.products_exception import CreateError, NotValid ,NotFound
from src.singleton.singleton import Singleton
from datetime import datetime, timedelta
from typing import List, Optional, Union, Dict, Any # Ensure Dict and Any are imported
from bson import ObjectId # Ensure ObjectId is imported
from fastapi import HTTPException # Ensure HTTPException is imported
from bson.errors import InvalidId

class ProductsCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Products database, implemented as a Singleton.
    """

    async def initialize(self) -> None:
        """
        Initializes the Products Collection with the 'shop' database and Product model.
        """
        # Ensure we have a connection
        await self.connection()
        
        # Use the existing database connection but access the 'shop' database
        database_name = "shop"
        self.db = self.client[database_name]
        
        # Initialize Beanie with the database and Product model
        await self.initialize_beanie(self.db, [Product])

    def _sanitize_product_doc(self, p_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitizes a single product document by handling '_id', invalid 'orderId' in 'cdKeys',
        and legacy field formats before Pydantic validation.
        """
        # Sanitize _id to id for Pydantic compatibility
        if "_id" in p_data:
            p_data["id"] = p_data.pop("_id")

        # Sanitize cdKeys before validation
        if "cdKeys" in p_data and p_data["cdKeys"]:
            sanitized_keys = []
            # Use deepcopy to avoid modifying the original document in-place
            for key_data in copy.deepcopy(p_data["cdKeys"]):
                if "orderId" in key_data and key_data["orderId"]:
                    try:
                        # Validate that the orderId is a proper ObjectId
                        PydanticObjectId(key_data["orderId"])
                    except (ValidationError, TypeError, ValueError, InvalidId):
                        # If validation fails, it's a legacy/invalid ID. Set to None silently.
                        # Only log if we're in debug mode to reduce noise
                        if logging.getLogger().level <= logging.DEBUG:
                            logging.debug(
                                f"Invalid orderId '{key_data['orderId']}' found in product "
                                f"'{p_data.get('id', 'N/A')}'. Sanitizing to None."
                            )
                        key_data["orderId"] = None
                sanitized_keys.append(key_data)
            p_data["cdKeys"] = sanitized_keys
        
        # Compatibility conversions for older data structures
        if 'createdAt' in p_data and 'created_at' not in p_data:
            p_data['created_at'] = p_data.pop('createdAt')
        if 'updatedAt' in p_data and 'updated_at' not in p_data:
            p_data['updated_at'] = p_data.pop('updatedAt')
        if isinstance(p_data.get('name'), str):
            p_data['name'] = {'en': p_data['name'], 'he': ''}
        if isinstance(p_data.get('description'), str):
            p_data['description'] = {'en': p_data['description'], 'he': ''}
            
        return p_data

    async def get_all_products(self) -> list[Product]:
        """
        Retrieves all products from the database, sanitizing them before validation.

        Returns:
            list[Product]: A list of all ACTIVE products in the database.
        """
        try:
            collection = Product.get_motor_collection()
            cursor = collection.find({"active": True})  # Only fetch active products
            products = []
            
            async for doc in cursor:
                product_id_for_logging = str(doc.get('_id', 'Unknown ID'))
                try:
                    sanitized_doc = self._sanitize_product_doc(doc)
                    product = Product.model_validate(sanitized_doc)
                    products.append(product)

                except ValidationError as ve:
                    logging.error(f"Validation error for product {product_id_for_logging} in get_all_products: {ve}")
                    continue # Skip this product
                except Exception as e:
                    logging.error(f"Unexpected error processing product {product_id_for_logging} in get_all_products: {e}")
                    continue # Skip this product

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
            query = {"best_seller": True, "active": True}  # Also filter for active products
            cursor = collection.find(query)
            if limit:
                cursor = cursor.limit(limit)
            products = []
            
            async for doc in cursor:
                product_id_for_logging = str(doc.get('_id', 'Unknown ID'))
                try:
                    sanitized_doc = self._sanitize_product_doc(doc)
                    product = Product.model_validate(sanitized_doc)
                    products.append(product)
                except ValidationError as ve:
                    logging.error(f"Validation error for best seller product {product_id_for_logging}: {ve}")
                    continue
                except Exception as e:
                    logging.error(f"Unexpected error processing best seller product {product_id_for_logging}: {e}")
                    continue
                
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
                product_id_for_logging = str(doc.get('_id', 'Unknown ID'))
                try:
                    sanitized_doc = self._sanitize_product_doc(doc)
                    product = Product.model_validate(sanitized_doc)
                    products.append(product)
                except ValidationError as ve:
                    logging.error(f"Validation error for recent product {product_id_for_logging}: {ve}")
                    continue
                except Exception as e:
                    logging.error(f"Unexpected error processing recent product {product_id_for_logging}: {e}")
                    continue

            return products
        except Exception as e:
            print(f"Error in get_recent_products: {str(e)}")
            return []
        
    async def get_product_by_name(self, product_name: str) -> Optional[Product]:
        """
        Retrieves a product by its name (slug).

        Args:
            product_name (str): The name (slug) of the product to retrieve.

        Returns:
            Optional[Product]: The product if found, otherwise None.
        """
        try:
            # Find the product by its English name, which is used as the slug.
            collection = Product.get_motor_collection()
            # The name field is a dictionary, so we query the 'en' key.
            product_doc = await collection.find_one({"name.en": product_name, "active": True})

            if product_doc:
                try:
                    # Sanitize before validation
                    sanitized_doc = self._sanitize_product_doc(product_doc)
                    return Product.model_validate(sanitized_doc)
                except ValidationError as ve:
                    logging.error(f"Validation error for product name {product_name}: {ve}")
                    return None # Or raise an exception
            return None
        except Exception as e:
            print(f"Error in get_product_by_name: {str(e)}")
            return None

    async def get_product_by_id(self, product_id: PydanticObjectId) -> Optional[Product]:
        """
        Retrieves a product by its ID.

        Args:
            product_id (PydanticObjectId): The ID of the product to retrieve.

        Returns:
            Optional[Product]: The product if found, otherwise None.
        """
        try:
            product_doc = await Product.get_motor_collection().find_one({"_id": product_id})
            if product_doc:
                try:
                    # Sanitize before validation
                    sanitized_doc = self._sanitize_product_doc(product_doc)
                    return Product.model_validate(sanitized_doc)
                except ValidationError as ve:
                    logging.error(f"Validation error for product ID {product_id}: {ve}")
                    return None
            return None
        except Exception as e:
            print(f"Error in get_product_by_id: {str(e)}")
            return None

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

    async def get_product_by_name(self, name: str) -> Optional[Product]:
        """
        Retrieves a product by its name.
        Handles both string names and multilingual dictionary names.

        Args:
            name (str): The name of the product to find.

        Returns:
            Optional[Product]: The product if found, otherwise None.
        """
        try:
            # Attempt to find by exact match on string name (for older data or simple names)
            product = await Product.find_one({"name": name, "active": True})
            if product:
                return product

            # Attempt to find by matching within the name dictionary (for multilingual names)
            # This searches if the provided name matches any of the language versions.
            # It's a common pattern to search for name.en == name or name.he == name etc.
            # For a direct match of the identifier against any language's name:
            product = await Product.find_one(
                {
                    "$or": [
                        {"name.en": name},
                        {"name.he": name},
                        # Add other languages if supported
                    ],
                    "active": True
                }
            )
            if product:
                return product
            
            # Fallback: Case-insensitive search for English name if others fail
            # This is often useful but can be slow without proper indexing.
            # Consider if this is needed or if exact matches are sufficient.
            # For now, let's assume the above exact matches are preferred.
            # If you need regex search:
            # product = await Product.find_one({\"name.en\": {\"$regex\": f\"^{re.escape(name)}$\", \"$options\": \"i\"}, \"active\": True})
            # if product:
            # return product

            # If no product is found by any method, raise NotFound
            raise NotFound(f"Product with name \'{name}\' not found")
        except NotFound: # Re-raise NotFound to be caught by the router
            raise
        except Exception as e:
            print(f"Error in get_product_by_name: {str(e)}")
            # For other exceptions, you might want to log and return None or raise a different error
            # For now, let's conform to raising NotFound or letting other errors propagate if they are unexpected
            raise NotFound(f"An error occurred while searching for product \'{name}\'")


    async def get_product_by_id(self, product_id: PydanticObjectId) -> Optional[Product]:
        """
        Retrieves a product by its ID.

        Args:
            product_id (PydanticObjectId): The ID of the product.

        Returns:
            Optional[Product]: The product if found, otherwise None.
        """
        try:
            product = await Product.get(product_id)
            if product and product.active: # Ensure product is active
                return product
            if not product:
                raise NotFound(f"Product with id \'{product_id}\' not found")
            if not product.active:
                raise NotFound(f"Product with id \'{product_id}\' is not active")
            return None # Should be covered by raises
        except Exception as e: # Catch potential Beanie errors if ID format is wrong, etc.
            print(f"Error in get_product_by_id: {str(e)}")
            raise NotFound(f"Product with id \'{product_id}\' not found or error occurred.")

    async def get_product_by_slug(self, product_slug: str) -> Optional[Product]:
        """
        Retrieves a product by its slug.

        Args:
            product_slug (str): The slug of the product.

        Returns:
            Optional[Product]: The product if found, otherwise None.
        """
        try:
            product = await Product.find_one({"slug": product_slug, "active": True})
            if not product:
                raise NotFound(f"Product with slug \'{product_slug}\' not found")
            return product
        except NotFound: # Re-raise NotFound
            raise
        except Exception as e:
            print(f"Error in get_product_by_slug: {str(e)}")
            raise NotFound(f"An error occurred while searching for product slug \'{product_slug}\'")

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
                product_id_for_logging = str(doc.get('_id', 'Unknown ID'))
                try:
                    sanitized_doc = self._sanitize_product_doc(doc)
                    product = Product.model_validate(sanitized_doc)
                    products.append(product)
                except ValidationError as ve:
                    logging.error(f"Validation error for homepage product {product_id_for_logging}: {ve}")
                    continue
                except Exception as e:
                    logging.error(f"Unexpected error processing homepage product {product_id_for_logging}: {e}")
                    continue
            return products
        except Exception as e:
            print(f"Error in get_homepage_products: {str(e)}")
            return []

    async def add_cd_keys_to_product(self, product_id: PydanticObjectId, cd_keys_request: list[dict]) -> Product:
        """
        Adds a list of CDKey objects to a product's cdKeys list.

        Args:
            product_id (PydanticObjectId): The ID of the product.
            cd_keys_request (list[dict]): A list of dictionaries, each representing a CDKey.

        Returns:
            Product: The updated product.
        """
        product = await Product.get(product_id)
        if not product:
            raise NotFound(f"Product with id {product_id} not found.")

        from src.models.products.products import CDKey # Local import

        new_cd_keys = [CDKey(**key_data) for key_data in cd_keys_request]

        if product.cdKeys is None:
            product.cdKeys = []
        
        product.cdKeys.extend(new_cd_keys)
        await product.save()
        return product

    async def update_cd_key_in_product(self, product_id: str, key_index: int, key_update_data: dict) -> dict:
        # Ensure product_id is a valid ObjectId string before querying
        try:
            obj_product_id = ObjectId(product_id)
        except Exception: # Handles InvalidId from bson.objectid
            # logger.error(f"Invalid product ID format: {product_id}") # Optional: logging
            raise HTTPException(status_code=400, detail=f"Invalid product ID format: {product_id}")

        product = await self.collection.find_one({"_id": obj_product_id})
        if not product:
            # logger.warning(f"Product with ID {product_id} not found during cd key update attempt.") # Optional: logging
            raise HTTPException(status_code=404, detail=f"Product with ID {product_id} not found")

        if not product.get("manages_cd_keys", False):
            # logger.warning(f"Attempt to update CD key for product {product_id} which does not manage keys.") # Optional: logging
            raise HTTPException(status_code=400, detail="This product does not manage CD keys.")

        cd_keys = product.get("cd_keys", [])
        if not isinstance(cd_keys, list):
            # logger.error(f"Product {product_id} cd_keys field is not a list.") # Optional: logging
            raise HTTPException(status_code=500, detail="Product cd_keys data is corrupted (not a list).")

        if not 0 <= key_index < len(cd_keys):
            # logger.warning(f"CD key index {key_index} out of bounds for product {product_id} with {len(cd_keys)} keys.") # Optional: logging
            raise HTTPException(status_code=404, detail=f"CD key at index {key_index} not found. Product has {len(cd_keys)} keys.")

        # Define fields that are allowed to be updated for a CD key
        allowed_fields_to_update = {"is_used", "notes", "assigned_to_order_id", "assigned_at"}
        set_query_updates = {}

        for field, value in key_update_data.items():
            if field == "key":
                # This is a critical security/integrity check.
                # logger.warning(f"Blocked attempt to update 'key' string for product {product_id}, key_index {key_index}.") # Optional: logging
                raise HTTPException(status_code=400, detail="Updating the key string itself is not allowed via this endpoint. Please delete and add a new key if changes are needed.")
            
            if field in allowed_fields_to_update:
                set_query_updates[f"cd_keys.{key_index}.{field}"] = value
            # else:
                # Optionally, log or raise an error for unexpected fields if strict validation is required.
                # logger.info(f"Ignoring unexpected field '{field}' in CD key update for product {product_id}, key_index {key_index}")

        if not set_query_updates:
            # This means the payload (key_update_data) either was empty or contained no fields that are allowed for update.
            # logger.warning(f"No valid fields provided for CD key update on product {product_id}, key_index {key_index}. Payload: {key_update_data}") # Optional: logging
            raise HTTPException(status_code=400, detail="No valid fields to update provided for the CD key. Allowed fields are: " + ", ".join(allowed_fields_to_update))

        # Perform the atomic update operation
        result = await self.collection.update_one(
            {"_id": obj_product_id},
            {"$set": set_query_updates}
        )

        if result.matched_count == 0:
            # This scenario implies the product was deleted between the initial find_one and this update_one call (race condition).
            # logger.error(f"Product {product_id} not found during update_one operation (race condition or deleted).") # Optional: logging
            raise HTTPException(status_code=404, detail="Product not found during update operation. It may have been deleted.")
        
        # result.modified_count == 0 is not an error; it means the data was already in the desired state.

        # Re-fetch the product to return its latest state, including the update
        updated_product = await self.collection.find_one({"_id": obj_product_id})
        if not updated_product:
            # This would be highly unusual if the update_one indicated a match.
            # logger.critical(f"Failed to retrieve product {product_id} after a successful-looking update.") # Optional: logging
            raise HTTPException(status_code=500, detail="Critical error: Failed to retrieve product after update.")
        
        return updated_product

    async def delete_cd_key_from_product(self, product_id: PydanticObjectId, cd_key_index: int) -> Product:
        """
        Deletes a specific CDKey from a product's cdKeys list by its index.

        Args:
            product_id (PydanticObjectId): The ID of the product.
            cd_key_index (int): The index of the CDKey in the cdKeys list to delete.

        Returns:
            Product: The updated product.
        """
        product = await Product.get(product_id)
        if not product:
            raise NotFound(f"Product with id {product_id} not found.")

        if product.cdKeys is None or not (0 <= cd_key_index < len(product.cdKeys)):
            raise NotFound(f"CDKey at index {cd_key_index} not found for product {product_id}.")

        del product.cdKeys[cd_key_index]
        
        await product.save()
        return product
