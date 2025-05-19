from datetime import datetime, timedelta
from src.mongodb.sales_collection import SalesCollection
from src.controller.controller_interface import ControllerInterface
from src.mongodb.keys_collection import KeysCollection
from src.mongodb.users_collection import UserCollection
from src.mongodb.products_collection import ProductsCollection


class SalesController(ControllerInterface):
    """Controller for managing sales data."""

    def __init__(
        self, 
        product_collection: ProductsCollection, 
        keys_collection: KeysCollection, 
        user_collection: UserCollection, 
        sale_collection: SalesCollection
    ):
        """
        Initializes the SalesController with dependencies.
        """
        self.product_collection = product_collection
        self.keys_collection = keys_collection
        self.user_collection = user_collection
        self.sale_collection = sale_collection

    async def initialize(self):
        """Initializes database connections and collections."""
        await self.keys_collection.connection()
        await self.keys_collection.initialize()

        await self.user_collection.connection()
        await self.user_collection.initialize()

        await self.product_collection.connection()
        await self.product_collection.initialize()

        await self.sale_collection.connection()
        await self.sale_collection.initialize()

    async def total_revenue(self, start_date: datetime = None, end_date: datetime = None , username:str ="") -> int:
        """
        Retrieves total revenue from SalesCollection.
        """
        await self.user_collection.validate_user_role(username)
        return await self.sale_collection.total_revenue(start_date,end_date)


    async def most_sold_products(self, start_date: datetime = None, end_date: datetime = None, limit:int =1 ,username:str ="") -> dict:
        """
        Retrieves the most sold products.
        """
        await self.user_collection.validate_user_role(username)
        return await self.sale_collection.most_sold_products(start_date, end_date,limit)
