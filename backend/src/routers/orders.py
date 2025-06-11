from fastapi import APIRouter, HTTPException, Depends, status # Added status
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
    # Ensure find_one is awaited
    order_from_db = await db.orders.find_one({"_id": ObjectId(order_id)})
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

    order_dict_for_db = {} 
    raw_data_dump = "order_data (Pydantic model) not available"

    try:
        try:
            raw_data_dump = order_data.model_dump_json(indent=2)
            print(f"Received order_data (Pydantic model): {raw_data_dump[:1000]}") 
        except Exception as log_exc:
            print(f"Could not serialize initial order_data for logging: {log_exc}")

        # Calculate original_total from items
        calculated_original_total = sum(item.price * item.quantity for item in order_data.items if item.price is not None and item.quantity is not None)
        order_data.original_total = calculated_original_total
        order_data.discount_amount = 0.0 # Default discount

        db = await mongo_db.get_db() # Get DB instance earlier for coupon check

        # Coupon Logic
        valid_coupon_applied = False
        if order_data.coupon_code:
            coupon = await db.coupons.find_one({"code": order_data.coupon_code})
            if coupon:
                is_active = coupon.get("active", False)
                expires_at_str = coupon.get("expiresAt")
                max_uses = coupon.get("maxUses")
                usage_count = coupon.get("usageCount", 0)
                
                is_expired = False
                if expires_at_str:
                    try:
                        # If it's a string, parse it. If it's already datetime, use it.
                        if isinstance(expires_at_str, str):
                            expires_at_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                        elif isinstance(expires_at_str, datetime):
                            expires_at_dt = expires_at_str
                        else: # Handle other potential types or log warning
                            expires_at_dt = None

                        if expires_at_dt and datetime.utcnow().replace(tzinfo=None) > expires_at_dt.replace(tzinfo=None): # Compare naive datetimes
                            is_expired = True
                    except ValueError:
                        print(f"Warning: Could not parse coupon expiresAt date: {expires_at_str}")
                        is_expired = True # Treat unparseable date as expired or invalid

                has_exceeded_uses = False
                if max_uses is not None and usage_count >= max_uses:
                    has_exceeded_uses = True

                if is_active and not is_expired and not has_exceeded_uses:
                    discount_value = coupon.get("discountValue", 0.0)
                    discount_type = coupon.get("discountType")

                    if discount_type == "percentage":
                        discount = order_data.original_total * (discount_value / 100)
                    elif discount_type == "fixed":
                        discount = discount_value
                    else:
                        discount = 0.0
                    
                    order_data.discount_amount = min(discount, order_data.original_total)
                    valid_coupon_applied = True # Mark that a valid coupon was processed
                else:
                    # Coupon is invalid (inactive, expired, or overused)
                    print(f"Coupon '{order_data.coupon_code}' is invalid. Active: {is_active}, Expired: {is_expired}, Exceeded Uses: {has_exceeded_uses}")
                    order_data.coupon_code = None # Clear invalid coupon code from order
                    order_data.discount_amount = 0.0
            else:
                # Coupon code not found
                print(f"Coupon code '{order_data.coupon_code}' not found.")
                order_data.coupon_code = None # Clear non-existent coupon code
                order_data.discount_amount = 0.0
        
        # Recalculate total based on original_total and discount_amount
        order_data.total = order_data.original_total - order_data.discount_amount

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
        # db = await mongo_db.get_db() # Moved up
        insert_result = await db.orders.insert_one(order_dict_for_db) 

        if not insert_result.inserted_id:
            print(f"MongoDB insert_one result: {insert_result.acknowledged}, Inserted ID: {insert_result.inserted_id}")
            raise HTTPException(status_code=500, detail="Failed to insert order into database, no ID returned by DB.")

        # Increment coupon usage count if a valid coupon was applied
        if valid_coupon_applied and order_data.coupon_code: # Check order_data.coupon_code again in case it was cleared
            coupon_code_used = order_data.coupon_code # The one that was validated and stored on the order
            await db.coupons.update_one(
                {"code": coupon_code_used}, 
                {"$inc": {"usageCount": 1}}
            )
            print(f"Incremented usage count for coupon: {coupon_code_used}")

        # 6. Retrieve and return the created order
        # Fetch using the ObjectId that was definitely used for insertion.
        created_order_from_db = await db.orders.find_one({"_id": order_dict_for_db["_id"]}) # Added await
        
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
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    existing_order_doc = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not existing_order_doc:
        raise HTTPException(status_code=404, detail="Order not found")

    # Convert ObjectId to string for Pydantic validation before creating the Order model instance
    if '_id' in existing_order_doc and isinstance(existing_order_doc['_id'], ObjectId):
        existing_order_doc['_id'] = str(existing_order_doc['_id'])
    
    existing_order = Order(**existing_order_doc)
    
    # Get the raw update dictionary, exclude_unset=True is important
    update_payload_dict = order_update_data.model_dump(exclude_unset=True, exclude_none=False)

    # --- Start Coupon and Total Recalculation Logic for Update ---
    # Determine if items or coupon_code are being updated, as this affects totals.
    items_updated = "items" in update_payload_dict
    coupon_code_updated_in_payload = "coupon_code" in update_payload_dict # True if key exists, even if value is None

    # If items are updated, original_total needs recalculation.
    # If coupon_code is updated (or removed), discount and total need recalculation.
    
    current_items = existing_order.items
    if items_updated:
        current_items = [OrderItem(**item_data) for item_data in update_payload_dict["items"]]
        # Update order_update_data.items to reflect the new items for Pydantic model consistency if needed later
        # However, we'll use current_items for calculation.
    
    # Calculate original_total based on current or new items
    new_original_total = sum(item.price * item.quantity for item in current_items if item.price is not None and item.quantity is not None)
    update_payload_dict["original_total"] = new_original_total
    new_discount_amount = 0.0
    final_coupon_code_to_store = existing_order.coupon_code # Start with existing
    
    # Determine the coupon code to process: from payload if provided, else existing.
    # If coupon_code is explicitly set to None in payload, it means remove coupon.
    coupon_code_to_evaluate = None
    if coupon_code_updated_in_payload:
        coupon_code_to_evaluate = update_payload_dict.get("coupon_code") # This could be a code or None
    else: # Coupon code not in payload, use existing one from the order
        coupon_code_to_evaluate = existing_order.coupon_code

    # Store original coupon details to adjust usage counts if it changes
    original_coupon_code_on_order = existing_order.coupon_code
    new_coupon_applied_in_update = False

    if coupon_code_to_evaluate:
        coupon = await db.coupons.find_one({"code": coupon_code_to_evaluate})
        if coupon:
            is_active = coupon.get("active", False)
            expires_at_str = coupon.get("expiresAt")
            # Max uses check should consider if this is the *same* coupon being re-validated
            # or a *new* coupon being applied.
            # If it's the same coupon, its current usageCount already includes this order.
            # If it's a new coupon, check against its usageCount.
            
            # For simplicity in update, we'll re-validate fully.
            # A more complex logic would be needed if we want to prevent re-applying an already "used up" coupon
            # if it was the one already on the order. But for now, if it's on the order, we assume it was valid.
            # The main concern is if a *new* coupon exceeds its uses.
            
            usage_count = coupon.get("usageCount", 0)
            max_uses = coupon.get("maxUses")

            is_expired = False
            if expires_at_str:
                try:
                    if isinstance(expires_at_str, str):
                        expires_at_dt = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))
                    elif isinstance(expires_at_str, datetime):
                        expires_at_dt = expires_at_str
                    else:
                        expires_at_dt = None
                    if expires_at_dt and datetime.utcnow().replace(tzinfo=None) > expires_at_dt.replace(tzinfo=None):
                        is_expired = True
                except ValueError:
                    is_expired = True

            has_exceeded_uses = False
            # If this coupon is the one already on the order, and it's now at max_uses,
            # it means this order is one of those uses. So, it's "technically" still valid for *this* order.
            # However, if an admin is trying to apply a *new* coupon that is already at max_uses, it should fail.
            if max_uses is not None and usage_count >= max_uses:
                 # If this coupon is the one already on the order, and it's now at max_uses,
                 # it means this order is one of those uses. So, it's "technically" still valid for *this* order.
                 # However, if an admin is trying to apply a *new* coupon that is already at max_uses, it should fail.
                 if coupon_code_to_evaluate != original_coupon_code_on_order: # Only fail for *new* fully used coupons
                    has_exceeded_uses = True


            if is_active and not is_expired and not has_exceeded_uses:
                discount_value = coupon.get("discountValue", 0.0)
                discount_type = coupon.get("discountType")
                if discount_type == "percentage":
                    discount = new_original_total * (discount_value / 100)
                elif discount_type == "fixed":
                    discount = discount_value
                else:
                    discount = 0.0
                
                new_discount_amount = min(discount, new_original_total)
                final_coupon_code_to_store = coupon_code_to_evaluate # Valid coupon
                new_coupon_applied_in_update = True # Indicates a valid coupon is active for this update
            else: # Coupon invalid or conditions not met
                final_coupon_code_to_store = None # Remove/clear if invalid
                new_discount_amount = 0.0
        else: # Coupon code not found
            final_coupon_code_to_store = None # Remove/clear if not found
            new_discount_amount = 0.0
    else: # No coupon code to evaluate (either wasn't in payload and not on existing, or explicitly set to None)
        final_coupon_code_to_store = None
        new_discount_amount = 0.0

    update_payload_dict["coupon_code"] = final_coupon_code_to_store
    update_payload_dict["discount_amount"] = new_discount_amount
    update_payload_dict["total"] = new_original_total - new_discount_amount
    # --- End Coupon and Total Recalculation Logic ---

    # Handle user_id specifically: if an empty string is passed, set to None
    if "user_id" in update_payload_dict and update_payload_dict["user_id"] == "":
        update_payload_dict["user_id"] = None
    
    # Prepare fields for $set, excluding _id and id from update_payload_dict
    # Also exclude statusHistory, createdAt, date as they are managed differently or immutable
    fields_to_set = {k: v for k, v in update_payload_dict.items() if k not in ["_id", "id", "statusHistory", "createdAt", "date"]}
    fields_to_set["updatedAt"] = datetime.utcnow() # Always update this

    mongo_update_operations = {"$set": fields_to_set}
    
    # Status History Update Logic (if status changes)
    if "status" in fields_to_set and fields_to_set["status"] != existing_order.status:
        new_status_history_entry = StatusHistoryEntry(
            status=fields_to_set["status"],
            date=datetime.utcnow(),
            note=update_payload_dict.get("notes", f"Status changed to {fields_to_set['status']} by admin") 
        ).model_dump()
        mongo_update_operations["$push"] = {"statusHistory": new_status_history_entry}

    if not fields_to_set and "$push" not in mongo_update_operations : # No actual changes
        return existing_order # Or Order(**existing_order_doc)

    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        mongo_update_operations
    )

    # --- Coupon Usage Count Adjustment ---
    # This needs to happen *after* the order update is confirmed.
    # 1. If a new coupon was applied: increment its count.
    # 2. If an old coupon was removed (or replaced): decrement its count.
    
    # Case 1: A new valid coupon is now on the order, and it's different from the original.
    if new_coupon_applied_in_update and final_coupon_code_to_store and final_coupon_code_to_store != original_coupon_code_on_order:
        await db.coupons.update_one(
            {"code": final_coupon_code_to_store},
            {"$inc": {"usageCount": 1}}
        )
        print(f"Incremented usage for new coupon: {final_coupon_code_to_store}")

    # Case 2: An old coupon was on the order, but now it's not (either removed or replaced).
    if original_coupon_code_on_order and original_coupon_code_on_order != final_coupon_code_to_store:
        await db.coupons.update_one(
            {"code": original_coupon_code_on_order},
            {"$inc": {"usageCount": -1}} # Decrement
        )
        print(f"Decremented usage for old coupon: {original_coupon_code_on_order}")
    # --- End Coupon Usage Count Adjustment ---

    updated_order_from_db = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not updated_order_from_db: 
        raise HTTPException(status_code=404, detail="Order not found after update attempt")
    
    # Convert ObjectId to string for Pydantic validation
    if '_id' in updated_order_from_db and isinstance(updated_order_from_db['_id'], ObjectId):
        updated_order_from_db['_id'] = str(updated_order_from_db['_id'])
    
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
    # Ensure find_one is awaited
    existing_order = await db.orders.find_one({"_id": ObjectId(order_id)})
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

    # Ensure update_one is awaited
    result = await db.orders.update_one(
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
        # Ensure find_one is awaited
        updated_order_check = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not updated_order_check:
             raise HTTPException(status_code=404, detail="Order not found after status update attempt.")
        # If it exists but wasn't modified by this operation (e.g. status was already as requested)
        # still return it as the state is consistent with the request.
        
        # Convert ObjectId to string for Pydantic validation
        if '_id' in updated_order_check and isinstance(updated_order_check['_id'], ObjectId):
            updated_order_check['_id'] = str(updated_order_check['_id'])
            
        return Order(**updated_order_check)

    # Ensure find_one is awaited
    updated_order_from_db = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not updated_order_from_db:
        # Should be extremely rare if modified_count was > 0
        raise HTTPException(status_code=404, detail="Order not found after successful status update.")

    # Convert ObjectId to string for Pydantic validation
    if '_id' in updated_order_from_db and isinstance(updated_order_from_db['_id'], ObjectId):
        updated_order_from_db['_id'] = str(updated_order_from_db['_id'])

    return Order(**updated_order_from_db)

# The PATCH /admin/orders/{order_id} handles comprehensive updates including status.

@router.delete("/orders/{order_id}", status_code=status.HTTP_200_OK)
async def delete_order_by_id(
    order_id: str,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency),
    mongo_db_instance: MongoDb = Depends(lambda: mongo_db) # Allow dependency injection for MongoDb
):
    # Verify admin role
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    db = await mongo_db.get_db()
    
    # Check if order exists before attempting deletion
    try:
        object_id_to_delete = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid order ID format: {order_id}")

    existing_order = await db.orders.find_one({"_id": object_id_to_delete})
    if not existing_order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order with ID {order_id} not found")

    # Get coupon code from the order before deleting, if any
    coupon_code_on_deleted_order = existing_order.get("coupon_code")

    # Perform the deletion
    delete_result = await db.orders.delete_one({"_id": object_id_to_delete})

    if delete_result.deleted_count == 0:
        # This case should ideally be caught by the find_one check above,
        # but it's a safeguard.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order with ID {order_id} not found, or already deleted.")

    # If a coupon was on the deleted order, decrement its usage count
    if coupon_code_on_deleted_order:
        await db.coupons.update_one(
            {"code": coupon_code_on_deleted_order},
            {"$inc": {"usageCount": -1}}
        )
        print(f"Decremented usage count for coupon '{coupon_code_on_deleted_order}' due to order deletion.")

    return {"message": f"Order with ID {order_id} deleted successfully"}
