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
            list[Product]: A list of all products in the database.
        """
        return await Product.find_all().to_list()

    async def get_best_sellers(self) -> list[Product]:
        """
            Retrieves all the best sellers products from the database.

            Returns:
                list[Product]: A list of all best sellers products in the database.
        """
        return await Product.find_many(Product.best_seller == True).to_list()

    async def get_recent_products(self, limit: int) -> list[Product]:
        """
        Retrieves the most recently created products.

        Args:
            limit (int): The number of recent products to retrieve. Defaults to 8.

        Returns:
            list[Product]: A list of recently created products.
        """
        return await Product.find().sort(-Product.created_at).limit(limit).to_list()
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
        
        try:            current_product = await self.get_product_by_id(product_id)
            
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

    async def get_product_by_name(self, name: str) -> Product:
        """
        Retrieves a product by its name.

        Args:
            name (str): The name of the product to retrieve.

        Returns:
            Product: The product with the given name, or None if not found.
        """
        product = await Product.find_one(Product.name == name)
        if not product: 
            raise  NotFound(f"not found product with the name: {name}")
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
        Deletes a product from the database.

        Args:
            product_id (PydanticObjectId): The ID of the product to delete.

        Returns:
            str: The deleted product's ID.
        """
        product: Product = await self.get_product_by_id(product_id)
        await product.delete()
        return str(product.id)
