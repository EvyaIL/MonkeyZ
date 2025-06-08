from beanie import PydanticObjectId
from src.models.key.key import Key, KeyRequest
from src.models.products.products import Product, ProductRequest
from src.controller.controller_interface import ControllerInterface
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.products_collection import ProductsCollection
from src.mongodb.users_collection import UserCollection
from src.mongodb.product_collection import ProductCollection
from src.models.products.products_exception import DeleteError
from typing import List

class ProductsController(ControllerInterface):
    """Controller for managing products, including creation, editing, and deletion."""

    def __init__(self, product_collection: ProductsCollection, keys_collection: KeysCollection, 
                 user_collection: UserCollection, admin_product_collection: ProductCollection):
        """
        Initializes the ProductsController with dependencies.

        Args:
            product_collection (ProductsCollection): Collection for product-related operations.
            keys_collection (KeysCollection): Collection for key-related operations.
            user_collection (UserCollection): Collection for user-related operations.
            admin_product_collection (ProductCollection): Collection for admin product operations.
        """
        self.product_collection = product_collection
        self.keys_collection = keys_collection
        self.user_collection = user_collection
        self.admin_product_collection = admin_product_collection

    async def initialize(self):
        """Initializes database connections and collections."""
        await self.keys_collection.connection()
        await self.keys_collection.initialize()
        await self.user_collection.connection()
        await self.user_collection.initialize()
        await self.product_collection.connection()
        await self.product_collection.initialize()
        await self.admin_product_collection.connection()
        await self.admin_product_collection.initialize()

    async def disconnect(self):
        """Disconnect from all collections."""
        await self.keys_collection.disconnect()
        await self.user_collection.disconnect()
        await self.product_collection.disconnect()
        await self.admin_product_collection.disconnect()

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
        
    async def get_homepage_products(self, limit: int = 6) -> list[Product]:
        """
            Retrieves products marked for display on the homepage.

            Args:
                limit (int): The maximum number of homepage products to retrieve. Defaults to 6.

            Returns:
        list[Product]: A list of products marked for homepage display.
        """
        return await self.product_collection.get_homepage_products(limit)

    async def sync_products(self):
        """
        Synchronize products between admin_product_collection and product_collection.
        """
        admin_products = await self.admin_product_collection.get_all_products()
        for product in admin_products:
            # Convert admin product to dict format for main collection
            try:
                # Handle both dict and Document objects
                if hasattr(product, 'dict'):
                    product_dict = product.dict()
                elif hasattr(product, 'model_dump'):
                    product_dict = product.model_dump()
                else:
                    product_dict = product
                
                # Ensure we have a string ID for the main collection
                product_id = str(product_dict.get('id', product_dict.get('_id')))
                
                # Try to update existing product in main collection using new dict methods
                try:
                    await self.product_collection.update_product_from_dict(product_id, product_dict)
                except ValueError:  # Product doesn't exist in main collection
                    # Create new product in main collection
                    await self.product_collection.create_product_from_dict(product_dict)
            except Exception as e:
                print(f"Error syncing product {getattr(product, 'id', 'unknown')}: {str(e)}")
                continue
                
    async def get_admin_products(self) -> list[Product]:
        """Get all admin products and sync with main collection."""
        products = await self.admin_product_collection.get_all_products()
        await self.sync_products()  # Keep collections in sync
        return products

    async def create_admin_product(self, product_data: dict) -> Product:
        """Create a new admin product and sync it to main collection."""
        product = await self.admin_product_collection.create_product(product_data)
        await self.sync_products()
        return product

    async def update_admin_product(self, product_id: str, product_data: dict) -> Product:
        """Update an admin product and sync changes to main collection."""
        product = await self.admin_product_collection.update_product(product_id, product_data)
        await self.sync_products()
        return product

    async def delete_admin_product(self, product_id: str) -> None:
        """Delete an admin product and its corresponding main product."""
        await self.admin_product_collection.delete_product(product_id)
        try:
            await self.product_collection.delete_product(product_id)
        except ValueError:
            pass  # Product may not exist in main collection

    # Coupon management methods
    async def get_all_coupons(self) -> List[Product]:
        """Get all coupons."""
        return await self.admin_product_collection.get_all_coupons()

    async def create_coupon(self, coupon_data: dict) -> Product:
        """Create a new coupon."""
        return await self.admin_product_collection.create_coupon(coupon_data)

    async def update_coupon(self, coupon_id: str, coupon_data: dict) -> Product:
        """Update a coupon."""
        return await self.admin_product_collection.update_coupon(coupon_id, coupon_data)

    async def delete_coupon(self, coupon_id: str) -> None:
        """Delete a coupon."""
        await self.admin_product_collection.delete_coupon(coupon_id)

