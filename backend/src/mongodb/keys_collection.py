import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import PydanticObjectId
from .mongodb import MongoDb
from src.models.key.key import Key, KeyRequest
from src.models.user.user import Role
from src.models.key.key_exception import UpdateError
from src.singleton.singleton import Singleton
from src.models.user.user import User


class KeysCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Keys collection, implemented as a Singleton.

    Methods
    -------
    initialize() -> None:
        Initializes the KeysDB with the 'shop' database and Key model.

    create_key(key_request: KeyRequest, user: User) -> Key:
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
        # Beanie initialization removed. Beanie should only be initialized once in main.py
        await self.connection()  # Ensure we're connected
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable is not set.")
        self.client = AsyncIOMotorClient(mongo_uri)
        self.db = self.client.get_database("shop")
        self.is_connected = True

    async def create_key(self, key_request: KeyRequest) -> Key:
        """
        Creates a new key in the database.

        Parameters
        ----------
        key_request : KeyRequest
            The key request containing key details.
        user : User
            The user creating the key.

        Returns
        -------
        Key
            The created key.
        """
        key = Key(key=key_request.key, product=key_request.product, is_active=key_request.is_active, owner=None)
        await key.save()
        return key
    


    async def update_key(self, key_id: PydanticObjectId, key_request: KeyRequest) -> Key:
        """
        Creates a new key in the database.

        Parameters
        ----------
        key_request : KeyRequest
            The key request containing key details.
        user : User
            The user creating the key.

        Returns
        -------
        Key
            The created key.
        """
        # self.validate_user_role(user)
        key:Key = await self.get_key_by_id(key_id)
        if not key:
            raise UpdateError("key not found")
        
        if key.owner:
            raise UpdateError("cant edit this key")
        
        key = Key(id=key.id,**key_request.model_dump(), owner=None)
        await key.save()
        return key

    async def get_key_by_id(self,  key_id: PydanticObjectId) -> Key:
        """
        Retrieves all keys by the owner's ID.

        Parameters
        ----------
        owner_id : PydanticObjectId
            The ID of the owner whose keys are to be retrieved.

        Returns
        -------
        list[Key]
            A list of keys owned by the given owner ID.
        """
        key = await Key.find_one(Key.id == key_id)
        return key

    
    async def delete_many_keys(keys: list[Key]):
        for key in keys:
            await key.delete()

    async def get_keys_by_product_id(self, product_id: str) -> list[Key]:
        """
        Retrieves all keys associated with a product ID.

        Parameters
        ----------
        product_id : str
            The ID of the product whose keys are to be retrieved.

        Returns
        -------
        list[Key]
            A list of keys for the specified product.
        """
        # Convert string ID to PydanticObjectId if needed
        if isinstance(product_id, str):
            try:
                from beanie import PydanticObjectId
                product_id = PydanticObjectId(product_id)
            except Exception as e:
                print(f"Error converting product_id to PydanticObjectId: {e}")
                return []
        
        # Find keys where product field matches the product_id
        keys = await Key.find(Key.product == product_id).to_list()
        return keys

    async def get_all_keys(self, batch_size: int = 1000) -> list[Key]:
        """
        Retrieves all keys efficiently using batching and cursor-based pagination.

        Parameters
        ----------
        batch_size : int, optional
            The number of keys to fetch in each batch, by default 1000

        Returns
        -------
        list[Key]
            A list of all keys in the database

        Notes
        -----
        Uses cursor-based batching for memory efficiency when dealing with large datasets.
        Includes basic fields projection to minimize network transfer.
        """
        try:
            # Use the motor collection for more direct control
            collection = Key.get_motor_collection()
            
            # Project only needed fields to reduce network transfer
            projection = {
                "product": 1,
                "status": 1,
                "issuedAt": 1,
                "usedAt": 1,
                "expiresAt": 1,
                "value": 1
            }
            
            # Use aggregation for better performance
            pipeline = [
                {"$project": projection},
                # Add index-based sorting for consistent results
                {"$sort": {"_id": 1}}
            ]
            
            cursor = collection.aggregate(pipeline)
            keys = []
            
            async for doc in cursor:
                # Convert motor document to Beanie model
                key = Key(**doc)
                keys.append(key)
                
                # Process in batches to manage memory
                if len(keys) >= batch_size:
                    # Yield each key in the batch individually
                    for k in keys:
                        yield k
                    keys = []
            
            # Yield any remaining keys
            for k in keys:
                yield k
                
        except Exception as e:
            print(f"Error in get_all_keys: {e}")
            # In case of error, yield nothing (the async generator will just end)


