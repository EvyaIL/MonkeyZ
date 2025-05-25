from fastapi import APIRouter, HTTPException, Depends
from typing import List
from ..lib.token_handler import get_current_user
from ..mongodb.mongodb import MongoDb
from ..models.user.user import Role
from ..deps.deps import get_user_controller_dependency
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List, Any

# Order Models
class OrderItem(BaseModel):
    productId: str
    name: str
    quantity: int
    price: float

class StatusHistoryEntry(BaseModel):
    status: str
    date: datetime
    note: Optional[str] = None

class Order(BaseModel):
    id: Optional[str] = None
    customerName: str
    email: str
    phone: Optional[str] = None
    status: str = "Pending"
    total: float
    items: List[OrderItem]
    statusHistory: List[StatusHistoryEntry] = []
    date: datetime = datetime.utcnow()
    createdAt: datetime = datetime.utcnow()

# Get MongoDB instance
mongo_db = MongoDb()
from datetime import datetime
from pymongo.database import Database
from bson import ObjectId

router = APIRouter()

@router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not user_controller.has_role(current_user.sub, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    orders = list(db.orders.find())
    for order in orders:
        order["id"] = str(order["_id"])
    return orders

@router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not user_controller.has_role(current_user.sub, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order["id"] = str(order["_id"])
    return order

@router.post("/orders", response_model=Order)
async def create_order(
    order: Order,
    current_user = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not user_controller.has_role(current_user.sub, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    order_dict = order.model_dump(exclude={"id"})
    order_dict["statusHistory"] = [
        {
            "status": order.status,
            "date": datetime.utcnow(),
            "note": "Order created"
        }
    ]
    result = db.orders.insert_one(order_dict)
    created_order = db.orders.find_one({"_id": result.inserted_id})
    created_order["id"] = str(created_order["_id"])
    return created_order

@router.patch("/orders/{order_id}", response_model=Order)
async def update_order_status(
    order_id: str,
    update: dict,
    current_user = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not user_controller.has_role(current_user.sub, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if "status" in update:
        # Add to status history
        history_entry = {
            "status": update["status"],
            "date": datetime.utcnow(),
            "note": update.get("note", "Status updated")
        }
        
        # Update the order
        db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {"status": update["status"]},
                "$push": {"statusHistory": history_entry}
            }
        )
    
    # Return updated order
    updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
    updated_order["id"] = str(updated_order["_id"])
    return updated_order
    order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if "status" in update:
        # Add to status history
        status_entry = StatusHistoryEntry(
            status=update["status"],
            date=datetime.utcnow()
        )
        db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": {"status": update["status"]},
                "$push": {"statusHistory": status_entry.dict()}
            }
        )
    
    updated_order = db.orders.find_one({"_id": ObjectId(order_id)})
    updated_order["id"] = str(updated_order["_id"])
    return updated_order
