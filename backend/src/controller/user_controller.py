from src.models.token.token import LoginResponse
from src.lib.token_handler import create_access_token
from src.models.user.user_response import SelfResponse
from src.controller.controller_interface import ControllerInterface
from src.models.user.user import User, UserRequest
from src.models.user.user_exception import LoginError
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.users_collection import UserCollection

class UserController(ControllerInterface):
    """Controller for managing user operations, including authentication and profile retrieval."""

    def __init__(self, keys_collection: KeysCollection, user_collection: UserCollection):
        """
        Initializes the UserController with dependencies.

        Args:
            keys_collection (KeysCollection): Collection for key-related operations.
            user_collection (UserCollection): Collection for user-related operations.
        """
        self.keys_collection = keys_collection
        self.user_collection = user_collection

    async def initialize(self):
        """Initializes database connections and collections."""
        await self.keys_collection.connection()
        await self.keys_collection.initialize()
        await self.user_collection.connection()
        await self.user_collection.initialize()

    async def get_user_by_token(self, username: str) -> SelfResponse:
        """
        Retrieves a user along with their associated keys.

        Args:
            username (str): The username of the user to retrieve.

        Returns:
            SelfResponse: The user's information including their keys.

        Raises:
            LoginError: If the user is not found.
        """
        current_user = await self.user_collection.get_user_by_username(username)

        if not current_user:
            raise LoginError("User not found")

        response = await self.get_user_response(current_user)
        return response
    
    async def login(self, body: UserRequest) -> LoginResponse:
        user:User = await self.user_collection.login(body)
        access_token = create_access_token(data={"sub":body.username})
        response = await self.get_user_response(user)
        response = LoginResponse(access_token=access_token, user=response,token_type="Bearer")
        return response


    async def get_user_response(self, user: User) -> SelfResponse:
        response = SelfResponse(**user.model_dump(exclude={"keys"}), keys={})
        if user.keys != None:
            for key_id in user.keys.keys():
                response[key_id] = await self.keys_collection.get_key_by_id(key_id)
        
        return response
