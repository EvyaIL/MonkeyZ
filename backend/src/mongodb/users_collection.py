from src.models.token.token import LoginResponse
from .mongodb import MongoDb
from src.models.user.user import User, UserRequest, Role
from src.models.user.user_exception import CreateError, LoginError, UserException
from src.singleton.singleton import Singleton
from src.lib.haseing import Hase
from src.lib.token_handler import create_access_token
from typing import Optional # Added Optional for type hinting
import logging

class UserCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the User Collection, implemented as a Singleton.

    Methods
    -------
    initialize() -> None:
        Initializes the UserCollection with the 'shop' database and User model.
    get_all_users() -> List[User]:
        Retrieves all users from the User collection.
    create_user(body: UserRequest) -> User:
        Creates a new user with the given details.
    loggin(body: UserRequest) -> User:
        Authenticates a user with the given details.
    get_user_by_username(username: str) -> User:
        Retrieves a user by their username.
    """

    async def initialize(self) -> None:
        """
            Initializes the UserDB with the 'shop' database and User model.
        """
        database_name = "shop"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [User])

    async def get_all_users(self) -> list[User]:
        """ Retrieves all users from the User collection.

            Returns
            -------
                List[User]
                    A list of all User documents.
        """
        users = await User.find_all().to_list()
        return users

    async def create_user(self, body: UserRequest) -> User:
        """ Creates a new user with the given details.

            Parameters
            ----------
                body : UserRequest
                    The user details for creating a new user.

            Returns
            -------
                User
                    The created user.

            Raises
            ------
                CreateUserException
                    If the username is already in use.
        """
        # Modified to not validate phone_number if it's None
        await self.validate_user_exist(body.username, body.email, body.phone_number)
        hashed_password = Hase.bcrypt(body.password)
        user = User(username=body.username, password=hashed_password , role=Role.default,email=body.email,phone_number=body.phone_number)
        await user.save()
        return user

    async def login(self, body: UserRequest) -> LoginResponse:
        """  Authenticates a user with the given details.

            Parameters
            ----------
                body : UserRequest
                    The user details for authentication.

            Returns
            -------
                str
                    The access token.

            Raises
            ------
                LogginUserException
                    If the username does not exist or the password is incorrect.
        """
        # Ensure we're connected to the database
        if not hasattr(self, 'client') or self.client is None:
            try:
                await self.connection()
            except Exception as e:
                logging.error(f"Failed to connect to MongoDB during login: {str(e)}")
                raise LoginError(f"Unable to connect to the database. Please try again later.")
        
        try:
            user = await self.get_user_by_username(body.username)
            if not user:
                raise LoginError("Username does not exist.")
            
            if not Hase.verify(body.password, user.password):
                raise LoginError("Password is incorrect.")
            
            return user
        except Exception as e:
            if "Failed to connect to MongoDB" in str(e) or "ServerSelectionTimeoutError" in str(e.__class__.__name__):
                logging.error(f"Database connection error during login: {str(e)}")
                raise LoginError("No response from the server. Please check your database connection.")
            else:
                # Re-raise other exceptions
                raise

    async def get_user_by_username(self, username: str) -> User:
        """ Retrieves a user by their username.

            Parameters
            ----------
                username : str
                    The username of the user to retrieve.

            Returns
            -------
                User
                    The user with the given username, or None if not found.
        """
        user = await User.find_one(User.username == username)
        return user

    async def get_user_by_email(self, email: str) -> User:
        """ Retrieves a user by their email.

            Parameters
            ----------
                email : str
                    The email of the user to retrieve.

            Returns
            -------
                User
                    The user with the given email, or None if not found.
        """
        user = await User.find_one(User.email == email)
        return user
    
    async def get_user_by_phone_number(self, phone_number: int) -> User:
        """ Retrieves a user by their phone_number.

            Parameters
            ----------
                phone_number : str
                    The phone_number of the user to retrieve.

            Returns
            -------
                User
                    The user with the given phone_number, or None if not found.
        """
        user = await User.find_one(User.phone_number == phone_number)
        return user
    
    async def validate_user_exist(self, username:str, email:str, phone_number:Optional[int]) -> None:
        """
        Validates if the user already exists by username, email, or phone number (if provided).

        Parameters
        ----------
        username : str
            The username to validate.
        email : str
            The email to validate.
        phone_number : Optional[int]
            The phone number to validate (if provided).

        Raises
        ------
        CreateError
            If the username, email, or phone number is already in use or phone number is invalid.
        """
        user = await self.get_user_by_username(username)
        if user:
            raise CreateError("This username already use")
        
        user = await self.get_user_by_email(email)
        if user:
            raise CreateError("This email already use")

        if phone_number is not None: # Only validate phone_number if it is provided
            try: 
                # Ensure phone_number is treated as int if it comes as a string from some contexts
                pn_int = int(phone_number) 
                user = await self.get_user_by_phone_number(pn_int)
                if user:
                    raise CreateError("This phone number already use")
            except ValueError: # Catches if phone_number cannot be converted to int
                raise CreateError("This phone number is not a valid integer")
            except Exception as e: # Catch other potential errors during validation
                # It might be better to log this error and raise a generic CreateError
                # or a more specific one if identifiable.
                # For now, re-raising a generic CreateError to avoid leaking details.
                # Consider logging `e` for debugging purposes.
                # logging.error(f"Error validating phone number: {e}")
                raise CreateError("Error validating phone number")

    async def validate_user_role(self, username: str) -> None:
        """
        Validates the role of the user.

        Parameters
        ----------
        user : User
            The user to validate.

        Raises
        ------
        ProductCreateNotValidException
            If the user does not have permission to edit keys.
        """
        user = await self.get_user_by_username(username)
        if user is None:
            raise LoginError("the user not exist")
        
        if user.role != Role.manager:
            raise UserException("This user can't edit")