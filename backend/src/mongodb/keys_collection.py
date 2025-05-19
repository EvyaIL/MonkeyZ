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
        database_name = "shop"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Key])

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


