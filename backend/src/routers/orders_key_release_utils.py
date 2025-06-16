from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from ..lib.token_handler import get_current_user
from ..mongodb.mongodb import MongoDb
from ..models.user.user import Role
from ..models.order import Order, OrderItem, StatusHistoryEntry, OrderStatusUpdateRequest, StatusEnum
from ..models.products.products import Product as ProductModel
from ..mongodb.product_collection import ProductCollection
from ..deps.deps import get_user_controller_dependency, get_product_collection_dependency
from datetime import datetime, timezone
from pymongo.database import Database
from bson import ObjectId
from ..models.token.token import TokenData

router = APIRouter()
mongo_db = MongoDb()

async def release_keys_for_order(order_doc, db):
    # For each item in the order, release assigned keys
    for item in order_doc.get('items', []):
        # Try all possible field names for assigned keys
        assigned_keys = (
            item.get('assigned_keys') or
            item.get('assignedKeys') or
            item.get('assigned_key') or
            item.get('assignedKey') or
            []
        )
        if isinstance(assigned_keys, str):
            assigned_keys = [assigned_keys]
        product_id = item.get('productId')
        if assigned_keys and product_id:
            # Use Beanie ODM for update
            try:
                product = await ProductModel.get(product_id)
            except Exception:
                product = None
            if product and product.cdKeys:
                assigned_keys_set = set(str(k).strip().lower() for k in assigned_keys)
                updated = False
                for key_obj in product.cdKeys:
                    key_str = str(getattr(key_obj, 'key', '')).strip().lower()
                    if key_str in assigned_keys_set:
                        key_obj.isUsed = False
                        key_obj.usedAt = None
                        key_obj.orderId = None
                        updated = True
                if updated:
                    product.updatedAt = datetime.now(timezone.utc)
                    await product.save()
