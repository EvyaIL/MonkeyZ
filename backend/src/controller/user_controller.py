import asyncio
from src.models.token.token import LoginResponse
from src.lib.token_handler import create_access_token
from src.models.user.user_response import SelfResponse
from src.controller.controller_interface import ControllerInterface
from src.models.user.user import User, UserRequest
from src.models.user.user_exception import LoginError
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.users_collection import UserCollection
from src.mongodb.product_collection import ProductCollection
from typing import List

class UserController(ControllerInterface):
    """Controller for managing user operations, including authentication and profile retrieval."""
    
    def __init__(self, keys_collection: KeysCollection, user_collection: UserCollection, product_collection: ProductCollection = None):
        """
        Initializes the UserController with dependencies.

        Args:
            keys_collection (KeysCollection): Collection for key-related operations.
            user_collection (UserCollection): Collection for user-related operations.
            product_collection (ProductCollection): Collection for admin product operations.
        """
        self.keys_collection = keys_collection
        self.user_collection = user_collection
        self.product_collection = product_collection
        
    async def initialize(self):
        """Initializes database connections and collections."""
        # Initialize all collections in parallel for better performance
        await self.keys_collection.connection()
        await self.user_collection.connection()
        if self.product_collection:
            await self.product_collection.connection()
            
        # Initialize collections in parallel
        init_tasks = [
            self.keys_collection.initialize(),
            self.user_collection.initialize()
        ]
        if self.product_collection:
            init_tasks.append(self.product_collection.initialize())
            
        # Wait for all initializations to complete
        await asyncio.gather(*init_tasks)

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
        access_token = create_access_token(data={"sub":user.username})
        response = await self.get_user_response(user)
        response = LoginResponse(access_token=access_token, user=response,token_type="Bearer")
        return response
    async def get_user_response(self, user: User) -> SelfResponse:
        response = SelfResponse(**user.model_dump(exclude={"keys"}), keys={})
        if user.keys != None:
            for key_id in user.keys.keys():
                response[key_id] = await self.keys_collection.get_key_by_id(key_id)
        
        return response
        
    # Admin product/coupon delegation methods
    async def get_admin_products(self):
        """Delegate to product_collection for admin products."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.get_all_products()
        
    async def create_admin_product(self, product_data):
        """Delegate to product_collection for creating admin products."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.create_product(product_data)
        
    async def update_admin_product(self, product_id, product_data):
        """Delegate to product_collection for updating admin products."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.update_product(product_id, product_data)
        
    async def delete_admin_product(self, product_id):
        """Delegate to product_collection for deleting admin products."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.delete_product(product_id)
        
    # Admin coupon methods
    async def get_all_coupons(self):
        """Delegate to product_collection for getting all coupons."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.get_all_coupons()
    
    async def create_coupon(self, coupon_data):
        """Delegate to product_collection for creating coupons."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.create_coupon(coupon_data)

    async def update_coupon(self, coupon_id, coupon_data):
        """Delegate to product_collection for updating coupons."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.update_coupon(coupon_id, coupon_data)
        
    async def delete_coupon(self, coupon_id):
        """Delegate to product_collection for deleting coupons."""
        if not self.product_collection:
            raise ValueError("Product collection not initialized")
        return await self.product_collection.delete_coupon(coupon_id)
    
    async def disconnect(self):
        """Disconnect from collections."""
        if self.user_collection:
            await self.user_collection.disconnect()
        if self.product_collection:
            await self.product_collection.disconnect()
