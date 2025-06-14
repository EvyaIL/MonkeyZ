from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from ..lib.token_handler import get_current_user
from ..mongodb.mongodb import MongoDb
from ..models.user.user import Role
from ..models.order import Order, OrderItem, StatusHistoryEntry, OrderStatusUpdateRequest, StatusEnum # Added StatusEnum
from ..models.products.products import Product as ProductModel # Added ProductModel
from ..mongodb.product_collection import ProductCollection # Added ProductCollection
from ..deps.deps import get_user_controller_dependency, get_product_collection_dependency # Added get_product_collection_dependency
from datetime import datetime
from pymongo.database import Database
from bson import ObjectId
from ..models.token.token import TokenData

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
    user_controller = Depends(get_user_controller_dependency),
    product_collection: ProductCollection = Depends(get_product_collection_dependency) # Added product_collection
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db = await mongo_db.get_db()
    order_id = ObjectId()
    order_data.id = str(order_id) # Ensure ID is set for the response model and for key assignment

    # Initialize order status - will be updated if stock is insufficient
    current_order_status = order_data.status if order_data.status else StatusEnum.PENDING

    # --- CD Key Assignment Logic ---
    order_awaits_stock = False
    for item_index, item in enumerate(order_data.items):
        try:
            product = await product_collection.get_product_by_id(item.productId)
        except Exception as e:
            # Log this error, product might not exist or ID is invalid
            print(f"Error fetching product {item.productId} for order {order_data.id}: {e}")
            # Decide how to handle: skip item, fail order, etc. For now, let's assume product must exist.
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {item.productId} not found.")

        if product and product.manages_cd_keys:
            available_keys_for_item = 0
            assigned_key_to_item = None

            # We need to assign one key per quantity if product manages keys
            # For simplicity in this step, let's assume quantity is 1 for key assignment.
            # If quantity > 1, this logic needs to be expanded to assign multiple keys
            # or handle it as an error/limitation for now.
            # For now, we handle quantity = 1 for key assignment. If quantity > 1 and manages_cd_keys,
            # it will likely go to AWAITING_STOCK unless multiple keys are assigned.

            if item.quantity > 0: # Process only if quantity is positive
                keys_assigned_for_this_item = 0
                temp_assigned_keys_for_order_item = []

                for key_idx, cd_key in enumerate(product.cdKeys):
                    if not cd_key.isUsed:
                        # Mark key as used
                        product.cdKeys[key_idx].isUsed = True
                        product.cdKeys[key_idx].usedAt = datetime.utcnow()
                        product.cdKeys[key_idx].orderId = PydanticObjectId(order_id) # Store order ID

                        # Assign the key string to the order item
                        # If an item has quantity > 1, we'd need a list of keys.
                        # For now, assigning the first available key if quantity is 1.
                        # This needs robust handling for quantity > 1.
                        if item.quantity == 1: # Simplified: assumes one key per item if manages_cd_keys
                             order_data.items[item_index].assigned_cd_key = cd_key.key
                        # If item.quantity > 1, we'd append to a list on the order item
                        # and increment keys_assigned_for_this_item.
                        # For now, this simplified version will only assign one key.

                        keys_assigned_for_this_item += 1
                        # For this example, if we need one key per item.quantity,
                        # we'd break here if keys_assigned_for_this_item == item.quantity
                        break # Found and assigned a key for this item (or the first of many if quantity > 1)
                
                if keys_assigned_for_this_item < item.quantity:
                    order_awaits_stock = True
                    # Potentially revert any keys tentatively assigned if partial assignment is not allowed
                    # For now, if any item is short, the whole order awaits stock.
                    print(f"Product {product.id} does not have enough keys for order {order_data.id}, item {item.name}. Required: {item.quantity}, Found: {keys_assigned_for_this_item}")
                    break # Stop processing further items for key assignment if one is short

                if keys_assigned_for_this_item > 0:
                    try:
                        await product.save() # Save changes to product (key status)
                    except Exception as e:
                        # Log this error, could be a concurrent modification or DB issue
                        print(f"Error saving product {product.id} after key assignment for order {order_data.id}: {e}")
                        # This is a critical error, might need to roll back or flag order
                        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update product stock.")
            
    if order_awaits_stock:
        current_order_status = StatusEnum.AWAITING_STOCK
    # --- End CD Key Assignment Logic ---

    order_data.status = current_order_status
    order_data.createdAt = datetime.utcnow()
    order_data.updatedAt = datetime.utcnow()
    order_data.date = order_data.date if order_data.date else datetime.utcnow() # Ensure date is set

    # Add initial status to history
    initial_status_entry = StatusHistoryEntry(
        status=order_data.status,
        date=datetime.utcnow(),
        note="Order created." if not order_awaits_stock else "Order created, awaiting stock for one or more items."
    )
    order_data.statusHistory = [initial_status_entry]

    # Prepare order for DB insertion
    # Pydantic model_dump is preferred over manual dict creation
    order_dict_for_db = order_data.model_dump(by_alias=True, exclude_none=True)
    order_dict_for_db["_id"] = order_id # Ensure the ObjectId is used for insertion

    # Coupon logic (simplified, assuming it's handled or not critical for this step)
    # If coupon_code is provided, validate and apply discount
    if order_data.coupon_code:
        coupon = await db.coupons.find_one({"code": order_data.coupon_code, "active": True})
        if coupon:
            if coupon.get("expiresAt") and coupon["expiresAt"] < datetime.utcnow():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon has expired.")
            if coupon.get("maxUses") is not None and coupon.get("usageCount", 0) >= coupon["maxUses"]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon has reached its maximum usage limit.")

            order_data.original_total = order_data.total # Store original total before discount
            if coupon["discountType"] == "percentage":
                discount = order_data.total * (coupon["discountValue"] / 100)
            elif coupon["discountType"] == "fixed":
                discount = coupon["discountValue"]
            else:
                discount = 0
            
            order_data.total -= discount
            order_data.discount_amount = discount
            
            # Update coupon usage count
            await db.coupons.update_one(
                {"_id": coupon["_id"]},
                {"$inc": {"usageCount": 1}}
            )
            order_dict_for_db["total"] = order_data.total
            order_dict_for_db["discount_amount"] = order_data.discount_amount
            order_dict_for_db["original_total"] = order_data.original_total
            order_dict_for_db["coupon_code"] = order_data.coupon_code
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or inactive coupon code.")
    else: # Ensure these fields are present even if no coupon
        order_dict_for_db["original_total"] = order_data.total
        order_dict_for_db["discount_amount"] = 0.0


    try:
        result = await db.orders.insert_one(order_dict_for_db)
        if not result.inserted_id:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order.")
        
        # Fetch the created order to return it, ensuring all fields are fresh from DB
        created_order_doc = await db.orders.find_one({"_id": result.inserted_id})
        if not created_order_doc:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve created order.")
        
        return Order(**created_order_doc)

    except Exception as e:
        # Log the full error for debugging
        print(f"Error during order creation: {e}")
        # Potentially revert key assignments if order creation fails
        # This part is complex and needs careful transaction-like management if possible,
        # or a cleanup mechanism. For now, we raise an error.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {e}")

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
