from beanie import PydanticObjectId
from .mongodb import MongoDb
from src.models.order import Order # Assuming Order model is in src.models.order
from src.singleton.singleton import Singleton
from typing import List, Optional, Dict, Any
from bson.objectid import ObjectId

class OrdersCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Orders Collection, implemented as a Singleton.
    """

    async def get_orders_by_coupon_code(self, coupon_code: str) -> List[Dict[str, Any]]:
        db = await self.get_db()
        # Normalize coupon code to lowercase for consistent searching
        coupon_code_lower = coupon_code.lower().strip()
        
        # Support both couponCode and coupon_code for legacy data, case-insensitive
        orders_cursor = db.orders.find({
            "$or": [
                {"couponCode": {"$regex": f"^{coupon_code_lower}$", "$options": "i"}},
                {"coupon_code": {"$regex": f"^{coupon_code_lower}$", "$options": "i"}}
            ]
        })
        orders_list = []
        async for order_doc in orders_cursor:
            # Normalize coupon fields for consistency
            order_doc['coupon_code'] = order_doc.get('coupon_code') or order_doc.get('couponCode')
            order_doc['couponCode'] = order_doc['coupon_code']
            orders_list.append(order_doc)
        return orders_list

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
            # Ensure email is a string
            if not isinstance(order_doc.get('email'), str):
                order_doc['email'] = ''
            # Sanitize item names to strings
            for itm in order_doc.get('items', []):
                nm = itm.get('name')
                if not isinstance(nm, str):
                    if isinstance(nm, dict):
                        itm['name'] = nm.get('en') or next(iter(nm.values()), '')
                    else:
                        itm['name'] = str(nm)
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
            # Normalize PayPal orders with cart
            if 'items' not in order_doc and 'cart' in order_doc:
                cart = order_doc.get('cart', [])
                # Map cart entries to items expected by Order model
                order_doc['items'] = [
                    {
                        'productId': c.get('id'),
                        'name': c.get('name', ''),
                        'quantity': c.get('quantity', 0),
                        'price': c.get('price', 0.0),
                        'assigned_keys': c.get('assigned_keys', [])
                    }
                    for c in cart
                ]
                # Ensure total field
                order_doc['total'] = order_doc.get('totalPaid') if order_doc.get('totalPaid') is not None else order_doc.get('total', 0.0)
                # Normalize other alias fields
                order_doc['original_total'] = order_doc.get('originalTotal')
                order_doc['discount_amount'] = order_doc.get('discountAmount')
                order_doc['coupon_code'] = order_doc.get('couponCode')
            # Convert ObjectId to string
            if '_id' in order_doc and isinstance(order_doc['_id'], ObjectId):
                order_doc['_id'] = str(order_doc['_id'])
            # Sanitize item names to strings
            for itm in order_doc.get('items', []):
                nm = itm.get('name')
                if not isinstance(nm, str):
                    if isinstance(nm, dict):
                        itm['name'] = nm.get('en') or next(iter(nm.values()), '')
                    else:
                        itm['name'] = str(nm)
            # Normalize missing or null email to the requested email
            if not isinstance(order_doc.get('email'), str):
                order_doc['email'] = email
            # Alias coupon/discount fields for Pydantic model
            order_doc['coupon_code'] = order_doc.get('coupon_code') or order_doc.get('couponCode')
            order_doc['discount_amount'] = order_doc.get('discount_amount') or order_doc.get('discountAmount')
            order_doc['original_total'] = order_doc.get('original_total') or order_doc.get('originalTotal')
            # Provide alias fields for JSON output
            order_doc['couponCode'] = order_doc['coupon_code']
            order_doc['discountAmount'] = order_doc['discount_amount']
            order_doc['originalTotal'] = order_doc['original_total']
            orders_list.append(Order(**order_doc))
        return orders_list
