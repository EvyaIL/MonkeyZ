# filepath: c:\Users\User\OneDrive\????? ??????\??????\GitHub\nin1\MonkeyZ\backend\src\mongodb\products_collection.py
from beanie import PydanticObjectId
from .mongodb import MongoDb
from src.models.products.products import Product, ProductRequest
from src.models.products.products_exception import CreateError, NotValid, NotFound
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
        # Removed: await self.initialize_beanie(self.db, [Product])
        # Beanie is now initialized only once in main.py

    async def get_all_products(self) -> list[Product]:
        """
        Retrieves all products from the database.

        Returns:
            list[Product]: A list of all products in the database.
        """
        return await Product.find_all().to_list()

    async def get_best_sellers(self) -> list[Product]:
        """
        Retrieves all the best sellers products from the database.
        Handles both best_seller and isBestSeller field names.

        Returns:
            list[Product]: A list of all best sellers products in the database.
        """
        try:
            # Try with snake_case field name
            best_sellers = await Product.find_many(Product.best_seller == True, Product.active == True).to_list()
            
            # If empty, try with camelCase field name
            if not best_sellers:
                best_sellers = await Product.find_many(Product.isBestSeller == True, Product.active == True).to_list()
                
            return best_sellers
        except Exception as e:
            print(f"Error in get_best_sellers: {str(e)}")
            # Fall back to active products if error occurs
            try:
                return await Product.find_many(Product.active == True).limit(8).to_list()
            except Exception as e2:
                print(f"Error in get_best_sellers fallback: {str(e2)}")
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
            return await Product.find_many(Product.active == True).sort(-Product.created_at).limit(limit).to_list()
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
            CreateError: If the product name is already in use.
        """
        if await self.get_product_by_name(product_request.name):
            raise CreateError("This name is already in use")
        product = self.update_or_create_product(product_request, {})
        # Ensure keys field is always present and is a dict
        if not hasattr(product, "keys") or product.keys is None:
            product.keys = {}
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
            logger.info(f"Looking for product with ID: {product_id}")
            current_product = await self.get_product_by_id(product_id)
            
            if current_product is None:
                logger.error(f"Product with ID {product_id} not found")
                raise ValueError(f"Product with ID {product_id} not found")
            
            logger.info(f"Found product: {current_product.name}")
            
            # Convert key_id to string for consistent handling
            key_id_str = str(key_id)
            
            # Initialize keys dict if it's None or empty
            if current_product.keys is None:
                logger.info("Initializing empty keys dictionary")
                current_product.keys = {}
            
            # Add the key to the product's keys dictionary
            current_product.keys[key_id_str] = key_id
            logger.info(f"Added key {key_id} to product keys. Total keys: {len(current_product.keys)}")
            
            # Save the product
            logger.info(f"Saving product {product_id} with key {key_id}")
            await current_product.save()
            
            # Verify the key was added
            updated_product = await self.get_product_by_id(product_id)
            if updated_product is None:
                logger.error(f"Product {product_id} not found after save")
            elif updated_product.keys is None or key_id_str not in updated_product.keys:
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
            Product: The created or updated product instance.        """
        return Product(**product_request, keys=keys)
        
    async def get_product_by_name(self, name: str) -> Product:
        """
        Retrieves a product by its name.

        Args:
            name (str): The name of the product to retrieve.

        Returns:
            Product: The product with the given name, or None if not found.
        """
        try:
            # First try exact match with name field
            product = await Product.find_one(Product.name == name)
            if not product:
                # Try case-insensitive search if exact match fails
                from pymongo import ASCENDING
                # Use a case-insensitive regex search for single character names                products = await Product.find_many({"name": {"$regex": f"^{name}$", "$options": "i"}}).to_list()
                if products and len(products) > 0:
                    return products[0]
                
                raise NotFound(f"Product not found with name: {name}")
            return product
        except Exception as e:
            if isinstance(e, NotFound):
                raise
            print(f"Error in get_product_by_name: {str(e)}")
            raise NotFound(f"Error finding product with name: {name}")
            
    async def get_product_by_id(self, product_id: PydanticObjectId) -> Product:
        """
        Retrieves a product by its ID.

        Args:
            product_id (PydanticObjectId): The ID of the product to retrieve.

        Returns:
            Product: The product with the given ID, or None if not found.
        """
        # Use the correct MongoDB primary key field
        return await Product.get(product_id)

    async def get_homepage_products(self, limit: int = 6) -> list[Product]:
        """
        Retrieves products marked for homepage display.
        Handles both display_on_homepage and displayOnHomepage field names.

        Args:
            limit (int): Maximum number of products to return. Default is 6.

        Returns:
            list[Product]: A list of products marked for homepage display.
        """
        try:
            # Try with snake_case field name
            homepage_products = await Product.find_many(Product.display_on_homepage == True, Product.active == True).limit(limit).to_list()
            
            # If empty, try with camelCase field name
            if not homepage_products:
                homepage_products = await Product.find_many(Product.displayOnHomepage == True, Product.active == True).limit(limit).to_list()
                
            return homepage_products
        except Exception as e:
            print(f"Error in get_homepage_products: {str(e)}")
            # Fall back to active products if error occurs
            try:
                return await Product.find_many(Product.active == True).limit(8).to_list()
            except Exception as e2:
                print(f"Error in get_homepage_products fallback: {str(e2)}")
                return []

    async def create_product_from_dict(self, product_data: dict) -> Product:
        """
        Creates a new product from dictionary data (used for syncing admin products).

        Args:
            product_data (dict): The product data dictionary.

        Returns:
            Product: The created product.
        """
        # Convert dict to ProductRequest for compatibility
        try:
            # Create ProductRequest from dictionary, handling missing fields
            product_request_data = {
                'name': product_data.get('name', ''),
                'description': product_data.get('description', ''),
                'price': float(product_data.get('price', 0.0)),
                'active': product_data.get('active', True),
                # Handle both naming conventions
                'best_seller': product_data.get('best_seller', product_data.get('isBestSeller', False)),
                'isBestSeller': product_data.get('isBestSeller', product_data.get('best_seller', False)),
                'display_on_homepage': product_data.get('display_on_homepage', product_data.get('displayOnHomepage', False)),
                'displayOnHomepage': product_data.get('displayOnHomepage', product_data.get('display_on_homepage', False)),
                'is_new': product_data.get('is_new', product_data.get('isNew', False)),
                'isNew': product_data.get('isNew', product_data.get('is_new', False)),
                'discount_percentage': product_data.get('discount_percentage', product_data.get('discountPercentage', 0)),
                'discountPercentage': product_data.get('discountPercentage', product_data.get('discount_percentage', 0)),
                'created_at': product_data.get('created_at', product_data.get('createdAt')),
                'createdAt': product_data.get('createdAt', product_data.get('created_at'))
            }
            
            from src.models.products.products import ProductRequest
            product_request = ProductRequest(**product_request_data)
            
            # Use the existing create_product method
            return await self.create_product(product_request)
            
        except Exception as e:
            print(f"Error creating product from dict: {str(e)}")
            # Fallback: create Product directly from dict
            from src.models.products.products import Product
            product = Product(**product_data)
            await product.save()
            return product

    async def update_product_from_dict(self, product_id: str, product_data: dict) -> Product:
        """
        Updates a product from dictionary data (used for syncing admin products).

        Args:
            product_id (str): The ID of the product to update.
            product_data (dict): The product data dictionary.

        Returns:
            Product: The updated product.
        """
        try:
            from beanie import PydanticObjectId
            obj_id = PydanticObjectId(product_id)
            current_product = await self.get_product_by_id(obj_id)
            
            if not current_product:
                # Product doesn't exist, create it
                return await self.create_product_from_dict(product_data)
            
            # Update the existing product
            product_data["updatedAt"] = datetime.now()
            await current_product.update({"$set": product_data})
            return current_product
            
        except Exception as e:
            print(f"Error updating product from dict: {str(e)}")
            # If update fails, try to create new product
            return await self.create_product_from_dict(product_data)
