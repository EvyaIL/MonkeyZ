from beanie import PydanticObjectId
from src.mongodb.image_collection import ImageCollection
from src.models.key.key import Key, KeyRequest
from src.models.products.products import Product, ProductRequest

from src.controller.controller_interface import ControllerInterface
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.products_collection import ProductsCollection
from src.mongodb.users_collection import UserCollection
from src.models.products.products_exception import CreateError, DeleteError

class ProductsController(ControllerInterface):
    """Controller for managing products, including creation, editing, and deletion."""

    def __init__(self, product_collection: ProductsCollection, keys_collection: KeysCollection, user_collection: UserCollection, image_collection:ImageCollection):
        """
        Initializes the ProductsController with dependencies.

        Args:
            product_collection (ProductsCollection): Collection for product-related operations.
            keys_collection (KeysCollection): Collection for key-related operations.
            user_collection (UserCollection): Collection for user-related operations.
        """
        self.product_collection = product_collection
        self.keys_collection = keys_collection
        self.user_collection = user_collection
        self.image_collection = image_collection


    async def initialize(self):
        """Initializes database connections and collections."""
        await self.keys_collection.connection()
        await self.keys_collection.initialize()
        
        await self.user_collection.connection()
        await self.user_collection.initialize()
        
        await self.product_collection.connection()
        await self.product_collection.initialize()
        
        await self.image_collection.connection()
        await self.image_collection.initialize()

    async def create_product(self, product_request: ProductRequest, username: str) -> str:
        """
        Creates a new product.

        Args:
            product_request (ProductRequest): The product request data.
            username (str): The username of the requester.

        Returns:
            str: The created product's ID.
        """
        await self.user_collection.validate_user_role(username)
        if await self.product_collection.get_product_by_name(product_request.name, False):
            raise CreateError("This name is already in use")
        
        product_request.image = await self.image_collection.create_image(product_request.image)
        
        product = await self.product_collection.create_product(product_request)
        return str(product.id)

    async def edit_product(self, product_id: PydanticObjectId, product_request: ProductRequest, username: str) -> str:
        """
        Edits an existing product.

        Args:
            product_id (PydanticObjectId): The ID of the product to edit.
            product_request (ProductRequest): The updated product data.
            username (str): The username of the requester.

        Returns:
            str: The edited product's ID.
        """
        await self.user_collection.validate_user_role(username)
        current_product = await self.product_collection.get_product_by_id(product_id)
        product_by_name = await self.product_collection.get_product_by_name(product_request.name, to_raise=False)

        if product_by_name and product_by_name.id != current_product.id and product_by_name.name == current_product.name:
            raise CreateError("This name is already in use")
        
        if product_request.image != current_product.image and not isinstance(product_request.image, PydanticObjectId):
            if current_product.image != None:
                await self.image_collection.delete_image(current_product.image)
            product_request.image = await self.image_collection.create_image(product_request.image)
        
        product = await self.product_collection.edit_product(product_id, product_request)
        return str(product.id)

    async def delete_product(self, product_id: PydanticObjectId, username: str) -> str:
        """
        Deletes a product, ensuring that no active keys are associated with it.

        Args:
            product_id (PydanticObjectId): The ID of the product to delete.
            username (str): The username of the requester.

        Returns:
            str: The deleted product's ID.

        Raises:
            DeleteError: If the product has active keys.
        """
        await self.user_collection.validate_user_role(username)
        product: Product = await self.product_collection.get_product_by_id(product_id)
        keys = []

        for key_id in product.keys:
            key: Key = await self.keys_collection.get_key_by_id(key_id)
            if key.owner:
                raise DeleteError("Cannot delete this product. Someone is using one of its keys.")
            keys.append(key)

        await self.keys_collection.delete_many_keys(keys)
        await self.product_collection.delete_product(product_id)
        await self.image_collection.delete_image(product.image)

        return str(product.id)

    async def update_key(self, key_id: PydanticObjectId, key_request: KeyRequest, username: str) -> str:
        """
        Updates an existing key.

        Args:
            key_id (PydanticObjectId): The ID of the key to update.
            key_request (KeyRequest): The updated key data.
            username (str): The username of the requester.

        Returns:
            str: The updated key's ID.
        """
        await self.user_collection.validate_user_role(username)
        key = await self.keys_collection.update_key(key_id, key_request)
        return str(key.id)
    
    async def get_best_sellers(self) -> list[Product]:
        """
            Retrieves all the best sellers products from the database.

            Returns:
                list[Product]: A list of all best sellers products in the database.
        """
        products:list[Product] = await self.product_collection.get_best_sellers()
        return products

    async def get_recent_products(self, limit: int) -> list[Product]:
        """
            Retrieves the most recently created products.

            Args:
                limit (int): The number of recent products to retrieve. Defaults to 8.

            Returns:
                list[Product]: A list of recently created products.
        """
        return await self.product_collection.get_recent_products(limit)
    
    async def get_many_products(self, products_id: list[PydanticObjectId]) -> list[Product]:
        """
            Retrieves many products products.

            Args:
                limit (int): The number of recent products to retrieve. Defaults to 8.

            Returns:
                list[Product]: A list of recently created products.
        """
        list_product = []
        for id in products_id:
            list_product.append(await self.product_collection.get_product_by_id(id))
        return list_product

