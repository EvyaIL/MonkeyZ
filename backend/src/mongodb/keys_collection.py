import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import PydanticObjectId
from datetime import datetime
from typing import List, Optional
from .mongodb import MongoDb
from src.models.key.key import Key, KeyCreateRequest, BulkKeyCreateRequest, KeyUpdateRequest, KeyStatus # Updated imports
from src.models.user.user import Role # Keep if user validation is still needed for some operations
from src.models.key.key_exception import UpdateError, KeyNotFoundError # Added KeyNotFoundError
from src.singleton.singleton import Singleton
# from src.models.user.user import User # Commented out if User object not directly passed to methods anymore

class KeysCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Keys collection, implemented as a Singleton.

    Methods
    -------
    initialize() -> None:
        Initializes the KeysDB with the 'shop' database and Key model.

    create_key(key_request: KeyCreateRequest, user: User) -> Key: # Changed KeyRequest to KeyCreateRequest
        Creates a new key in the database.

    get_keys_by_owner(owner_id: PydanticObjectId) -> list[Key]:
        Retrieves all keys by the owner's ID.

    validate_user_role(user: User) -> None:
        Validates the role of the user.
    """

    async def initialize(self) -> None:
        """
        Initializes the KeysDB with the 'shop' database and Key model.
        """
        await self.connection()  # Ensure we're connected
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable is not set.")
            
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db = self.client.get_database("shop")
        await self.initialize_beanie(self.db, [Key]) # Ensure Key model is initialized
        self.is_connected = True

    async def add_keys_to_product(self, product_id: PydanticObjectId, bulk_key_request: BulkKeyCreateRequest) -> List[Key]:
        """
        Adds multiple keys for a specific product.

        Parameters
        ----------
        product_id : PydanticObjectId
            The ID of the product to add keys to (typically from path parameter).
        bulk_key_request : BulkKeyCreateRequest
            The request containing a list of key strings and target status.

        Returns
        -------
        List[Key]
            A list of the created Key documents.
        """
        keys_to_create = []
        # Note: If bulk_key_request also contains a product_id,
        # validation against the path product_id should occur at the router/service level.
        # Here, we use the product_id passed as a method argument.
        for key_str in bulk_key_request.key_strings:  # Corrected from .keys to .key_strings
            key_doc = Key(
                key_string=key_str,
                product_id=product_id,  # Using product_id from method argument
                status=bulk_key_request.status,  # Using status from the request
                added_date=datetime.utcnow()
                # order_id and used_date are None by default
            )
            keys_to_create.append(key_doc)
        
        if keys_to_create:
            await Key.insert_many(keys_to_create)
        return keys_to_create

    async def find_available_key_for_product(self, product_id: PydanticObjectId) -> Optional[Key]:
        """
        Finds an available key for a given product.

        Parameters
        ----------
        product_id : PydanticObjectId
            The ID of the product.

        Returns
        -------
        Optional[Key]
            An available Key document or None if no key is available.
        """
        key = await Key.find_one(
            Key.product_id == product_id,
            Key.status == KeyStatus.AVAILABLE
        )
        return key

    async def mark_key_as_used(self, key_id: PydanticObjectId, order_id: PydanticObjectId) -> Key:
        """
        Marks a key as used, associating it with an order_id and setting the used_date.

        Parameters
        ----------
        key_id : PydanticObjectId
            The ID of the key to mark as used.
        order_id : PydanticObjectId
            The ID of the order this key is being used for.

        Returns
        -------
        Key
            The updated Key document.
        
        Raises
        ------
        KeyNotFoundError
            If the key with the given ID is not found.
        UpdateError
            If the key is not available to be marked as used.
        """
        key = await Key.get(key_id)
        if not key:
            raise KeyNotFoundError(f"Key with id {key_id} not found.")
        
        if key.status != KeyStatus.AVAILABLE:
            raise UpdateError(f"Key with id {key_id} is not available. Current status: {key.status}")

        key.status = KeyStatus.USED
        key.order_id = order_id
        key.used_date = datetime.utcnow()
        await key.save()
        return key

    async def count_keys_by_status_for_product(self, product_id: PydanticObjectId, status: KeyStatus) -> int:
        """
        Counts keys for a product by a specific status.

        Parameters
        ----------
        product_id : PydanticObjectId
            The ID of the product.
        status : KeyStatus
            The status of the keys to count.

        Returns
        -------
        int
            The number of keys matching the criteria.
        """
        count = await Key.find(
            Key.product_id == product_id,
            Key.status == status
        ).count()
        return count

    async def get_total_keys_for_product(self, product_id: PydanticObjectId) -> int:
        """
        Gets the total number of keys for a specific product.

        Parameters
        ----------
        product_id : PydanticObjectId
            The ID of the product.

        Returns
        -------
        int
            The total number of keys for the product.
        """
        count = await Key.find(Key.product_id == product_id).count()
        return count
    
    async def get_keys_for_product(self, product_id: PydanticObjectId, skip: int = 0, limit: int = 100) -> List[Key]:
        """
        Retrieves all keys for a specific product with pagination.

        Parameters
        ----------
        product_id : PydanticObjectId
            The ID of the product.
        skip : int, optional
            Number of keys to skip, by default 0.
        limit : int, optional
            Maximum number of keys to return, by default 100.


        Returns
        -------
        List[Key]
            A list of keys for the specified product.
        """
        keys = await Key.find(Key.product_id == product_id).skip(skip).limit(limit).to_list()
        return keys

    # --- Potentially refactor or remove old methods ---

    async def create_key(self, key_create_request: KeyCreateRequest) -> Key: # Updated signature
        """
        Creates a new key in the database.
        Now uses KeyCreateRequest which includes product_id.
        """
        key = Key(
            key_string=key_create_request.key_string,
            product_id=key_create_request.product_id,
            status=KeyStatus.AVAILABLE, # Default to AVAILABLE
            added_date=datetime.utcnow()
        )
        await key.save()
        return key
    
    async def update_key_details(self, key_id: PydanticObjectId, key_update_request: KeyUpdateRequest) -> Key:
        """
        Updates details of an existing key.
        Allows changing key_string or status (e.g., to RESERVED or back to AVAILABLE if not USED).
        Does not allow changing product_id or order_id directly through this method if already set.

        Parameters
        ----------
        key_id : PydanticObjectId
            The ID of the key to update.
        key_update_request : KeyUpdateRequest
            The request containing updated key details.

        Returns
        -------
        Key
            The updated key.
        
        Raises
        ------
        KeyNotFoundError
            If the key with the given ID is not found.
        UpdateError
            If trying to modify a key that is already USED in a way that's not allowed.
        """
        key = await Key.get(key_id)
        if not key:
            raise KeyNotFoundError(f"Key with id {key_id} not found.")

        if key.status == KeyStatus.USED and \
           (key_update_request.status != KeyStatus.USED or key_update_request.key_string != key.key_string):
            raise UpdateError("Cannot significantly alter a key that has already been used, except for minor corrections if allowed by policy.")

        update_data = key_update_request.model_dump(exclude_unset=True)
        
        # Prevent changing product_id or order_id via this generic update if they are already set.
        # Specific methods should handle such changes if necessary.
        if 'product_id' in update_data and key.product_id:
            del update_data['product_id']
        if 'order_id' in update_data and key.order_id:
            del update_data['order_id']

        if update_data:
            await key.update({"$set": update_data})
            # Re-fetch to get the updated document with proper types
            updated_key = await Key.get(key_id)
            if not updated_key: # Should not happen if update was successful
                 raise KeyNotFoundError(f"Key with id {key_id} disappeared after update.")
            return updated_key
        return key


    async def get_key_by_id(self, key_id: PydanticObjectId) -> Optional[Key]: # Renamed from get_key_by_id for clarity
        """
        Retrieves a key by its ID.
        """
        key = await Key.get(key_id)
        return key
    
    async def delete_key(self, key_id: PydanticObjectId) -> bool:
        """
        Deletes a key by its ID, only if it's not associated with an order.
        
        Parameters
        ----------
        key_id : PydanticObjectId
            The ID of the key to delete.

        Returns
        -------
        bool
            True if deletion was successful, False otherwise.
            
        Raises
        ------
        KeyNotFoundError
            If the key with the given ID is not found.
        UpdateError
            If the key is already used or reserved in a way that prevents deletion.
        """
        key = await Key.get(key_id)
        if not key:
            raise KeyNotFoundError(f"Key with id {key_id} not found.")
        
        if key.status == KeyStatus.USED or key.order_id is not None:
            raise UpdateError(f"Cannot delete key {key_id} as it is already used or associated with an order.")
        
        # Potentially allow deletion of RESERVED keys or only AVAILABLE ones based on policy
        # For now, allowing deletion if not USED.
        
        delete_result = await key.delete()
        return delete_result.deleted_count > 0


    # Removed get_keys_by_owner as owner is not part of the Key model anymore.
    # Removed validate_user_role as it's not used in current methods. Can be re-added if needed for specific admin checks.
    # Old get_keys_by_product_id is replaced by get_keys_for_product with pagination.

    async def get_all_keys(self, skip: int = 0, limit: int = 1000) -> List[Key]: # Simplified, consider if full dump is needed
        """
        Retrieves all keys with pagination.
        Warning: Fetching all keys can be resource-intensive. Use with caution.
        """
        keys = await Key.find_all().skip(skip).limit(limit).to_list()
        return keys

    # The old get_all_keys with aggregation and projection might be useful for specific analytics later.
    # For now, a simpler find_all with pagination is provided.
    # If specific projections are needed for performance, a new method can be created or this one adapted.

    # Old delete_many_keys - Beanie's delete_many can be used directly on a query if needed.
    # Example: await Key.find(Key.product_id == some_id, Key.status == KeyStatus.AVAILABLE).delete()
    # For now, providing a single key delete method.


