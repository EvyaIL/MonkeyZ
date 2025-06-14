import asyncio
from src.models.token.token import LoginResponse
from src.lib.token_handler import create_access_token
from src.models.user.user_response import SelfResponse
from src.controller.controller_interface import ControllerInterface
from src.models.user.user import User, UserRequest, Role
from src.models.user.user_exception import LoginError
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.users_collection import UserCollection
from src.mongodb.product_collection import ProductCollection # Ensure this is the one being used
# from src.mongodb.products_collection import ProductsCollection # Removed as ProductCollection is now standard
from typing import List

class UserController(ControllerInterface):
    """Controller for managing user operations, including authentication and profile retrieval."""
    
    def __init__(self, keys_collection: KeysCollection, user_collection: UserCollection, admin_product_collection: ProductCollection = None, shop_product_collection: ProductCollection = None): # Changed ProductsCollection to ProductCollection
        """
        Initializes the UserController with dependencies.

        Args:
            keys_collection (KeysCollection): Collection for key-related operations.
            user_collection (UserCollection): Collection for user-related operations.
            admin_product_collection (ProductCollection): Collection for product operations (points to shop.Product).
            shop_product_collection (ProductCollection): Also points to shop.Product, passed for consistency but effectively the same as admin_product_collection.
        """
        self.keys_collection = keys_collection
        self.user_collection = user_collection
        # admin_product_collection is expected to be the ProductCollection instance for 'shop.Product'
        self.admin_product_collection = admin_product_collection
        # self.product_collection is used by many internal methods, ensure it points to the correct shop collection
        self.product_collection = admin_product_collection  
        # self.shop_product_collection is also the same shop.Product collection instance
        self.shop_product_collection = shop_product_collection
        
    async def initialize(self):
        """Initializes database connections and collections."""
        # Initialize all collections in parallel for better performance
        # Assuming connection() and initialize() are idempotent or safe to call on the same instance if admin_product_collection and shop_product_collection are identical.
        # As per deps.py, admin_product_collection and shop_product_collection are the same instance from get_product_collection_dependency()
        
        if self.keys_collection: # Check if collection exists before calling methods
            await self.keys_collection.connection()
        if self.user_collection:
            await self.user_collection.connection()
        if self.admin_product_collection: # This is the shop.Product collection
            await self.admin_product_collection.connection()
        # No separate connection for self.shop_product_collection if it's the same object as self.admin_product_collection
            
        init_tasks = []
        if self.keys_collection:
            init_tasks.append(self.keys_collection.initialize())
        if self.user_collection:
            init_tasks.append(self.user_collection.initialize())
        if self.admin_product_collection: # This is the shop.Product collection
            init_tasks.append(self.admin_product_collection.initialize())
        # No separate initialize for self.shop_product_collection if it's the same object
            
        if init_tasks: # Ensure there are tasks to gather
             await asyncio.gather(*init_tasks)

    async def has_role(self, username: str, role: Role) -> bool:
        """
        Check if a user has a specific role.

        Args:
            username (str): The username of the user.
            role (Role): The role to check for.

        Returns:
            bool: True if the user has the role, False otherwise.
        """
        user = await self.user_collection.get_user_by_username(username)
        if user and user.role and role == user.role:
            return True
        return False

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
        response = LoginResponse(access_token=access_token, user=response, token_type="Bearer")
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
            
        # Ensure boolean fields are properly converted to boolean values
        if 'displayOnHomePage' in product_data:
            product_data['displayOnHomePage'] = bool(product_data['displayOnHomePage'])
        if 'best_seller' in product_data:
            product_data['best_seller'] = bool(product_data['best_seller'])
            
        return await self.product_collection.create_product(product_data)
        
    async def update_admin_product(self, product_id, product_data):
        """Update product in the shop collection. Redundant sync to a separate shop collection is removed."""
        if not self.product_collection: # self.product_collection is shop.Product
            raise ValueError("Product collection not initialized")
        
        # Ensure boolean fields are properly converted to boolean values
        if 'displayOnHomePage' in product_data:
            product_data['displayOnHomePage'] = bool(product_data['displayOnHomePage'])
        if 'best_seller' in product_data:
            product_data['best_seller'] = bool(product_data['best_seller'])
            
        # This updates the product in the shop.Product collection directly
        updated_product = await self.product_collection.update_product(product_id, product_data)
        
        # The following block for syncing to self.shop_product_collection is removed
        # as self.product_collection and self.shop_product_collection point to the same shop.Product collection.
        # if self.shop_product_collection:
        #     product_dict = updated_product.dict() if hasattr(updated_product, 'dict') else (
        #         updated_product.model_dump() if hasattr(updated_product, 'model_dump') else updated_product
        #     )
        #     try:
        #         await self.shop_product_collection.update_product_from_dict(product_id, product_dict)
        #     except Exception:
        #         await self.shop_product_collection.create_product_from_dict(product_dict)
                
        return updated_product
        
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
    
    async def sync_products(self):
        """Synchronize products - This is now a no-op as only one product collection (shop.Product) is used."""
        # The original logic synced an admin collection to a shop collection.
        # Since all operations now target shop.Product directly, this explicit sync is not needed.
        return True # Indicate success without performing any operations.

    async def disconnect(self):
        """Disconnect from collections."""
        if self.user_collection:
            await self.user_collection.disconnect()
        if self.product_collection:
            await self.product_collection.disconnect()
