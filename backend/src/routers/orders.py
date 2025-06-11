from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from ..lib.token_handler import get_current_user
from ..mongodb.mongodb import MongoDb
from ..models.user.user import Role
from ..models.order import Order, OrderItem, StatusHistoryEntry, OrderStatusUpdateRequest
from ..deps.deps import get_user_controller_dependency
from datetime import datetime
from pymongo.database import Database
from bson import ObjectId
from ..models.token.token import TokenData # Ensure this path is correct

router = APIRouter()

# Get MongoDB instance
mongo_db = MongoDb()

@router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    orders_from_db = list(db.orders.find())
    return [Order(**order) for order in orders_from_db]

@router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    order_from_db = db.orders.find_one({"_id": ObjectId(order_id)})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order_from_db)

@router.post("/orders", response_model=Order)
async def create_order(
    order_data: Order,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        db = await mongo_db.get_db()
        
        order_dict = order_data.model_dump(by_alias=True, exclude_none=False) 
        
        if order_dict.get("user_id") == "":
            order_dict["user_id"] = None

        if "statusHistory" not in order_dict or order_dict["statusHistory"] is None:
            order_dict["statusHistory"] = []
        
        current_status_entry = StatusHistoryEntry(
            status=order_data.status, 
            date=datetime.utcnow(), 
            note="Order created by admin"
        ).model_dump()
        order_dict["statusHistory"].insert(0, current_status_entry)

        now = datetime.utcnow()
        order_dict.setdefault("date", now)
        order_dict.setdefault("createdAt", now)
        order_dict.setdefault("updatedAt", now)
        
        if "_id" in order_dict and isinstance(order_dict["_id"], str):
            try:
                order_dict["_id"] = ObjectId(order_dict["_id"])
            except Exception: 
                pass 

        insert_result = db.orders.insert_one(order_dict)
        if not insert_result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to insert order into database, no ID returned.")

        created_order_from_db = db.orders.find_one({"_id": insert_result.inserted_id})
        if not created_order_from_db:
            raise HTTPException(status_code=404, detail="Order created but could not be retrieved from database.")
        
        return Order(**created_order_from_db)

    except HTTPException as http_exc: 
        raise http_exc
    except Exception as e:
        error_message = f"Internal server error creating order: {str(e)}"
        print(f"!!!!!!!! Backend Error in create_order: {error_message}")
        print(f"Data causing error (first 500 chars): {str(order_dict)[:500] if 'order_dict' in locals() else 'order_dict not available'}")
        raise HTTPException(status_code=500, detail=error_message)

@router.patch("/orders/{order_id}", response_model=Order)
async def update_order( 
    order_id: str,
    order_update_data: Order, 
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    existing_order_doc = db.orders.find_one({"_id": ObjectId(order_id)})
    if not existing_order_doc:
        raise HTTPException(status_code=404, detail="Order not found")

    existing_order = Order(**existing_order_doc)

    update_data = order_update_data.model_dump(exclude_unset=True, exclude_none=False)

    # Handle user_id specifically: if an empty string is passed, set to None
    if "user_id" in update_data and update_data["user_id"] == "":
        update_data["user_id"] = None
    
    # Prepare fields for $set, excluding _id and id from update_data
    fields_to_set = {k: v for k, v in update_data.items() if k not in ["_id", "id", "statusHistory", "createdAt", "date"]}


    # If status is being updated and is different from the current status
    if "status" in update_data and update_data["status"] != existing_order.status:
        new_status_history_entry = StatusHistoryEntry(
            status=update_data["status"],
            date=datetime.utcnow(),
            note=update_data.get("notes", f"Status changed to {update_data['status']} by admin") # Or a more specific note if provided
        ).model_dump()
        
        result = db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {
                "$set": fields_to_set,
                "$push": {"statusHistory": new_status_history_entry}
            }
        )
    elif fields_to_set: # If other fields are being updated without status change, or status is same
        result = db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": fields_to_set}
        )
    else: # No actual changes to set, but maybe status history needs an update if notes were part of status change logic
        pass # Or return existing_order if no changes detected

    if result and result.modified_count == 0 and not ("status" in update_data and update_data["status"] != existing_order.status and fields_to_set):
        # If nothing was modified and it wasn't just a status history push for an existing status
        # This condition might need refinement based on exact desired behavior for no-op updates
        pass

    updated_order_from_db = db.orders.find_one({"_id": ObjectId(order_id)})
    if not updated_order_from_db: 
        raise HTTPException(status_code=404, detail="Order not found after update attempt")
    return Order(**updated_order_from_db)

@router.put("/orders/{order_id}/status", response_model=Order)
async def update_order_status_specific(
    order_id: str,
    status_update: OrderStatusUpdateRequest,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.ADMIN):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    existing_order = db.orders.find_one({"_id": ObjectId(order_id)})
    if not existing_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if existing_order["status"] == status_update.status:
        # If status is the same, no actual update needed, but maybe log an attempt or return current
        # For now, just return the existing order as no change is made to status or history here.
        return Order(**existing_order)

    history_entry = StatusHistoryEntry(
        status=status_update.status,
        date=datetime.utcnow(),
        note=status_update.note or f"Status changed to {status_update.status} by admin"
    ).model_dump()

    result = db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {
            "$set": {"status": status_update.status, "updatedAt": datetime.utcnow()},
            "$push": {"statusHistory": history_entry}
        }
    )

    if result.modified_count == 0:
        # This might happen if the order was deleted just before this update
        # Or if the status was somehow already updated by another process to the target status
        # Re-fetch to be sure and to get the latest doc for the response
        updated_order_check = db.orders.find_one({"_id": ObjectId(order_id)})
        if not updated_order_check:
             raise HTTPException(status_code=404, detail="Order not found after status update attempt.")
        # If it exists but wasn't modified by this operation (e.g. status was already as requested)
        # still return it as the state is consistent with the request.
        return Order(**updated_order_check)

    updated_order_from_db = db.orders.find_one({"_id": ObjectId(order_id)})
    if not updated_order_from_db:
        # Should be extremely rare if modified_count was > 0
        raise HTTPException(status_code=404, detail="Order not found after successful status update.")

    return Order(**updated_order_from_db)

# The PATCH /admin/orders/{order_id} handles comprehensive updates including status.
