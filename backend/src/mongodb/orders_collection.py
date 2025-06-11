from beanie import PydanticObjectId
from .mongodb import MongoDb
from src.models.order import Order # Assuming Order model is in src.models.order
from src.singleton.singleton import Singleton
from typing import List, Optional
from bson import ObjectId

class OrdersCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Orders Collection, implemented as a Singleton.
    """

    async def initialize(self) -> None:
        """
        Initializes the OrdersCollection with the 'shop' database and Order document.
        Note: Beanie initialization for Order might happen globally or per collection.
        If Order is a Beanie Document, it should be included in the global init_beanie call.
        This initialize method focuses on ensuring the db connection.
        """
        # Assuming global Beanie initialization handles the Order document.
        # If not, and Order is a Beanie Document, it might need:
        # await self.initialize_beanie(self.db, [Order])
        # However, existing routers seem to use direct pymongo via self.db.orders
        pass # db is initialized in MongoDb base or via get_db()

    async def get_orders_by_user_id(self, user_id: str) -> List[Order]:
        db = await self.get_db()
        orders_cursor = db.orders.find({"user_id": user_id})
        orders_list = []
        async for order_doc in orders_cursor:
            orders_list.append(Order(**order_doc))
        return orders_list

    async def get_order_by_id(self, order_id: str) -> Optional[Order]:
        db = await self.get_db()
        order_doc = await db.orders.find_one({"_id": ObjectId(order_id)})
        if order_doc:
            return Order(**order_doc)
        return None

    async def get_orders_by_email(self, email: str) -> List[Order]:
        db = await self.get_db()
        orders_cursor = db.orders.find({"email": email})
        orders_list = []
        async for order_doc in orders_cursor:
            if '_id' in order_doc and isinstance(order_doc['_id'], ObjectId):
                order_doc['_id'] = str(order_doc['_id']) # Convert ObjectId to string
            orders_list.append(Order(**order_doc))
        return orders_list
