from src.models.token.token import LoginResponse
from .mongodb import MongoDb
from src.models.user.user import User, UserRequest, Role
from src.models.user.user_exception import CreateError, LoginError, UserException
from src.singleton.singleton import Singleton
from src.lib.haseing import Hase
from src.lib.token_handler import create_access_token

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
        await self.validate_user_exiest(body.username, body.email ,body.phone_number)
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
        user = await self.get_user_by_username(body.username)
        if not user:
            raise LoginError("Username does not exist.")
        
        if not Hase.verify(body.password, user.password):
            raise LoginError("Password is incorrect.")
        
        return  user

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
    
    async def validate_user_exiest(self, username:str, email:str, phone_number:int) -> None:
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
        if user:
            raise CreateError("This username alrady use")
        
        user = await self.get_user_by_email(email)
        if user:
            raise CreateError("This email alrady use")

        try : 
            user = await self.get_user_by_phone_number(int(phone_number))
            if user:
                raise CreateError("This phone number alrady use")
        except:
            raise CreateError("This phone number is not valid")

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