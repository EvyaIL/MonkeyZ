from beanie import PydanticObjectId
from src.models.user.user_exception import LoginError

from src.models.key.key import Key, KeyRequest
from src.models.key.key_exception import GetError

from src.controller.controller_interface import ControllerInterface

from src.mongodb.keys_collection import KeysCollection
from src.mongodb.users_collection import UserCollection
from src.mongodb.products_collection import ProductsCollection


class KeyController(ControllerInterface):
    """Controller for managing keys, including creation, validation, and association with products."""

    def __init__(self, product_collection: ProductsCollection, keys_collection: KeysCollection, user_collection: UserCollection):
        """
        Initializes the KeyController with dependencies.

        Args:
            product_collection (ProductsCollection): Collection for product-related operations.
            keys_collection (KeysCollection): Collection for key-related operations.
            user_collection (UserCollection): Collection for user-related operations.
        """
        self.product_collection = product_collection
        self.keys_collection = keys_collection
        self.user_collection = user_collection

    async def initialize(self):
        """Initializes database connections and collections."""
        await self.keys_collection.connection()
        await self.keys_collection.initialize()
        await self.user_collection.connection()
        await self.user_collection.initialize()
        await self.product_collection.connection()
        await self.product_collection.initialize()

    async def disconnect(self):
        """Disconnect from all collections."""
        # Explicitly call disconnect on all collections
        await self.keys_collection.disconnect()
        await self.user_collection.disconnect()
        await self.product_collection.disconnect()

    async def create_key(self, key_request: KeyRequest, username: str) -> str:
        """
        Creates a new key and associates it with a product.

        Args:
            key_request (KeyRequest): The key request data.
            username (str): The username of the requester.

        Returns:
            str: The created key's ID.
        """
        import logging
        logging.basicConfig(level=logging.INFO)
        logger = logging.getLogger(__name__)
        
        try:
            # Log the key being created
            logger.info(f"Creating key for product {key_request.product} with value: {key_request.key}")
            
            # Validate user role
            await self.user_collection.validate_user_role(username)
            
            # Create key in database
            key = await self.keys_collection.create_key(key_request)
            logger.info(f"Key created with ID: {key.id}")
            
            # Associate key with product
            logger.info(f"Associating key {key.id} with product {key_request.product}")
            if key_request.product is not None and key.id is not None:
                await self.product_collection.add_key_to_product(key_request.product, key.id)
            else:
                logger.error(f"Cannot add key to product: product_id or key_id is None")
                
            # Return key ID
            return str(key.id)
        except Exception as e:
            logger.error(f"Error creating key: {str(e)}")
            raise e

    async def update_key(self,key_id:PydanticObjectId, key_request:KeyRequest,username:str) -> str:
        """ update a key.

            Args:
                key_id (PydanticObjectId): The key id.
                key_request (KeyRequest): The key request data.
                username (str): The username of the requester.

            Returns:
                str: The key's ID.
        """
        await self.user_collection.validate_user_role(username)
        key = await self.keys_collection.update_key(key_id,key_request)
        return str(key.id)
    
    
    async def get_keys_by_product(self, product_id: PydanticObjectId, start_index: int, max_keys: int, username: str) -> list[Key]:
        """
        Retrieves a paginated list of keys associated with a given product.

        Args:
            product_id (PydanticObjectId): The ID of the product whose keys are being requested.
            start_index (int): The starting index for pagination.
            max_keys (int): The maximum number of keys to retrieve.
            username (str): The username of the requester.

        Returns:
            list[Key]: A list of keys associated with the product.

        Raises:
            UserRoleError: If the user does not have the required role.
        """
        await self.user_collection.validate_user_role(username)
        product = await self.product_collection.get_product_by_id(product_id)
        keys_ids = product.keys.keys()[start_index: start_index + max_keys]
        keys = await self.get_keys(keys_ids)

        return keys

    async def get_keys_by_user(self, start_index: int, max_keys: int, username: str) -> list[Key]:
        """
        Retrieves a paginated list of keys owned by a specific user.

        Args:
            start_index (int): The starting index for pagination.
            max_keys (int): The maximum number of keys to retrieve.
            username (str): The username of the requester.

        Returns:
            list[Key]: A list of keys owned by the user.

        Raises:
            LoginError: If the user does not exist.
            GetError: If a retrieved key does not belong to the user.
        """
        user = await self.user_collection.get_user_by_username(username)
        if user is None:
            raise LoginError("The user does not exist")

        keys_ids = user.keys.keys()[start_index: start_index + max_keys]
        keys = await self.get_keys(keys_ids)
        for key in keys:
            if key.owner != user.id:
                raise GetError()

        return keys

    async def get_keys(self, keys_ids: list[PydanticObjectId]) -> list[Key]:
        """
        Retrieves a list of keys given their IDs.

        Args:
            keys_ids (list[PydanticObjectId]): A list of key IDs to fetch.

        Returns:
            list[Key]: A list of keys corresponding to the provided IDs.
        """
        keys = []
        for key_id in keys_ids:
            key = await self.keys_collection.get_key_by_id(key_id)
            keys.append(key)

        return keys
    
    async def get_all_keys_batch(self, batch_size: int = 1000) -> list[Key]:
        """
        Retrieves all keys using the optimized batch processing generator.

        Args:
            batch_size (int, optional): Size of each batch. Defaults to 1000.

        Returns:
            list[Key]: List of all keys.

        Notes:
        -----
        Uses the optimized get_all_keys generator from KeysCollection and
        collects all keys into a list. For very large datasets, consider
        using the generator directly instead.
        """
        keys = []
        try:
            async for key in self.keys_collection.get_all_keys(batch_size):
                keys.append(key)
            return keys
        except Exception as e:
            print(f"Error collecting keys: {e}")
            return []
