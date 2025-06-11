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
from ..models.token.token import TokenData # Corrected import path

router = APIRouter()

# Get MongoDB instance
mongo_db = MongoDb()

@router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    orders_cursor = db.orders.find()
    orders_from_db = await orders_cursor.to_list(length=None) # Use to_list with length=None to get all documents
    
    # Convert ObjectId to string for Pydantic validation
    processed_orders = []
    for order_doc in orders_from_db:
        if '_id' in order_doc and isinstance(order_doc['_id'], ObjectId):
            order_doc['_id'] = str(order_doc['_id'])
        processed_orders.append(Order(**order_doc))
    
    return processed_orders

@router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.manager):
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
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    order_dict_for_db = {} # Define for broader scope in except block
    raw_data_dump = "order_data (Pydantic model) not available" # For logging

    try:
        # Log the initial Pydantic model received after FastAPI processing
        try:
            raw_data_dump = order_data.model_dump_json(indent=2)
            print(f"Received order_data (Pydantic model): {raw_data_dump[:1000]}") # Log first 1k chars
        except Exception as log_exc:
            print(f"Could not serialize initial order_data for logging: {log_exc}")

        # Pydantic model 'order_data' has defaults applied for id, date, createdAt, updatedAt, statusHistory.
        
        # 1. Prepare Status History
        new_status_entry = StatusHistoryEntry(
            status=order_data.status, # status from client or model default "Pending"
            date=datetime.utcnow(), 
            note="Order created by admin"
        )
        # order_data.statusHistory is initialized to [] by Pydantic's default_factory if not sent
        if order_data.statusHistory is None: # Should be redundant due to default_factory
            order_data.statusHistory = []
        order_data.statusHistory.insert(0, new_status_entry)

        # 2. Ensure updatedAt is current for this creation event
        order_data.updatedAt = datetime.utcnow()

        # 3. Convert Pydantic model to dictionary for MongoDB
        # by_alias=True uses "_id" instead of "id"
        # exclude_none=False includes fields explicitly set to None by client (e.g. user_id)
        order_dict_for_db = order_data.model_dump(by_alias=True, exclude_none=False)
        
        # 4. Data sanitization/transformation for DB
        # Ensure user_id is None if it was an empty string from client
        if order_dict_for_db.get("user_id") == "":
            order_dict_for_db["user_id"] = None
        
        # The 'id' (aliased to '_id') from model_dump is a string. Convert to ObjectId for DB.
        if "_id" in order_dict_for_db and isinstance(order_dict_for_db["_id"], str):
            try:
                order_dict_for_db["_id"] = ObjectId(order_dict_for_db["_id"])
            except Exception as e:
                print(f"Error converting _id string to ObjectId: {e}. Value was: {order_dict_for_db['_id']}")
                raise # Re-raise to be caught by the main try-except
        else:
            # This case should ideally not be hit if Pydantic's default_factory for 'id' works.
            # If _id is missing or not a string, generate a new one.
            print(f"Warning: _id was missing or not a string in order_dict_for_db. Generating new ObjectId. Current _id: {order_dict_for_db.get('_id')}")
            order_dict_for_db["_id"] = ObjectId() 

        # Log the dictionary that will be inserted into MongoDB
        try:
            print(f"Attempting to insert into DB: {str(order_dict_for_db)[:1000]}") # Log first 1k chars
        except Exception as log_exc:
            print(f"Could not serialize order_dict_for_db for logging before insert: {log_exc}")

        # 5. Database insertion
        db = await mongo_db.get_db()
        insert_result = db.orders.insert_one(order_dict_for_db)
        
        if not insert_result.inserted_id:
            # This means MongoDB acknowledged the write but didn't return an _id, which is unusual for insert_one.
            # Or insert_result itself might indicate an issue.
            print(f"MongoDB insert_one result: {insert_result.acknowledged}, Inserted ID: {insert_result.inserted_id}")
            raise HTTPException(status_code=500, detail="Failed to insert order into database, no ID returned by DB.")

        # 6. Retrieve and return the created order
        # Fetch using the ObjectId that was definitely used for insertion.
        created_order_from_db = db.orders.find_one({"_id": order_dict_for_db["_id"]})
        
        if not created_order_from_db:
            # This would be very strange if insert_one succeeded.
            print(f"Order inserted with _id {order_dict_for_db['_id']} but not found immediately after.")
            raise HTTPException(status_code=404, detail="Order created but could not be retrieved from database.")
        
        return Order(**created_order_from_db)

    except HTTPException as http_exc: 
        # Re-raise HTTPExceptions directly
        raise http_exc
    except Exception as e:
        # Catch any other exceptions (Pydantic ValidationErrors if they occur post-FastAPI, DB errors, etc.)
        error_type = type(e).__name__
        error_message_detail = str(e)
        error_message = f"Internal server error creating order: {error_type} - {error_message_detail}"
        
        print(f"!!!!!!!! Backend Error in create_order: {error_message}")
        
        # Log the dictionary that was attempted for DB insertion (if populated)
        db_data_dump = "order_dict_for_db not available or not yet populated"
        if 'order_dict_for_db' in locals() and order_dict_for_db:
            try:
                # Attempt to convert datetime/ObjectId back to str for simpler logging if needed
                # This is a simplified representation for logging
                loggable_dict = {k: (str(v) if isinstance(v, (datetime, ObjectId)) else v) for k, v in order_dict_for_db.items()}
                db_data_dump = str(loggable_dict)
            except Exception as dump_exc:
                db_data_dump = f"Could not serialize order_dict_for_db for logging: {dump_exc}"
        print(f"Data intended for DB (order_dict_for_db) (first 1000 chars): {db_data_dump[:1000]}")
        
        # Log the raw Pydantic model data received by the endpoint
        print(f"Raw Pydantic model data received (order_data) (first 1000 chars): {raw_data_dump[:1000]}")

        # If it's a Pydantic ValidationError, log its specific errors
        if error_type == "ValidationError": # Check if 'e' is a Pydantic ValidationError
            try:
                # Pydantic v2: e.errors()
                # Pydantic v1: e.errors
                validation_errors = e.errors() if hasattr(e, 'errors') and callable(e.errors) else getattr(e, 'errors', 'No detailed errors found')
                print(f"Pydantic ValidationError details: {validation_errors}")
            except Exception as pydantic_log_exc:
                print(f"Could not extract Pydantic ValidationError details: {pydantic_log_exc}")

        raise HTTPException(status_code=500, detail=error_message)

@router.patch("/orders/{order_id}", response_model=Order)
async def update_order( 
    order_id: str,
    order_update_data: Order, 
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    # Use current_user.username and await has_role
    if not await user_controller.has_role(current_user.username, Role.manager):
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
    if not await user_controller.has_role(current_user.username, Role.manager):
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
