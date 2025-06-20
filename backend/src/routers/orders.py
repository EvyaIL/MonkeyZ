from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from ..lib.token_handler import get_current_user
from ..mongodb.mongodb import MongoDb
from ..models.user.user import Role
from ..models.order import Order, OrderItem, StatusHistoryEntry, OrderStatusUpdateRequest, StatusEnum
from ..models.products.products import Product as ProductModel, CDKey # Import CDKey
from ..mongodb.product_collection import ProductCollection
from ..deps.deps import get_user_controller_dependency, get_product_collection_dependency
from datetime import datetime, timezone # Import timezone
from pymongo.database import Database
from bson import ObjectId
from ..models.token.token import TokenData
from .orders_key_release_utils import release_keys_for_order
from ..services.coupon_service import CouponService

router = APIRouter()

# Get MongoDB instance
mongo_db = MongoDb()

async def assign_key_to_order_item(
    order_id: str, 
    item: OrderItem, 
    product_collection: ProductCollection, 
    db: Database
) -> bool:
    """
    Attempts to assign an available CD key to an order item.
    Marks the key as used and updates the product in the database.
    Returns True if a key was successfully assigned, False otherwise.
    """
    product = await product_collection.get_product_by_id(item.productId)
    if not product or not product.manages_cd_keys:
        return False # Product doesn't manage keys or not found

    assigned_key_to_item = None
    key_updated_in_product = False

    # Find an available key
    for key_obj in product.cdKeys:
        if not key_obj.isUsed:
            key_obj.isUsed = True
            key_obj.usedAt = datetime.now(timezone.utc)
            key_obj.orderId = ObjectId(order_id) # Store order ID
            item.assigned_key = key_obj.key # Assign key to order item
            assigned_key_to_item = key_obj.key
            key_updated_in_product = True
            break
    
    if key_updated_in_product:
        # Update the product document with the modified cdKeys list
        await db.Product.update_one( # Assuming your collection is named "Product"
            {"_id": product.id},
            {"$set": {"cdKeys": [k.model_dump() for k in product.cdKeys]}} # Use model_dump() for Pydantic v2
        )
        return True
    return False

@router.post("/orders", response_model=Order)
async def create_order(
    order_data: Order, 
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency),
    product_collection: ProductCollection = Depends(get_product_collection_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db = await mongo_db.get_db()
    order_id_obj = ObjectId()
    order_data.id = str(order_id_obj)

    current_order_status = StatusEnum.PENDING
    all_items_have_keys = True

    for item_index, item in enumerate(order_data.items):
        if item.quantity <= 0:
            continue

        product = await product_collection.get_product_by_id(item.productId)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with ID {item.productId} not found.")

        if product.manages_cd_keys:
            assigned_keys = []
            # Use Beanie model for updating and saving
            product_doc = await ProductModel.get(product.id)
            available_keys = [k for k in product_doc.cdKeys if not k.isUsed]
            if len(available_keys) < item.quantity:
                all_items_have_keys = False
                await db.Product.update_one(
                    {"_id": product.id},
                    {"$inc": {"failed_key_assignments": 1}}
                )
                print(f"Order {order_data.id}, Item {item.productId}: Not enough available keys. Marked for AWAITING_STOCK.")
            else:
                for i in range(item.quantity):
                    key_obj = available_keys[i]
                    key_obj.isUsed = True
                    key_obj.usedAt = datetime.now(timezone.utc)
                    key_obj.orderId = order_data.id
                    assigned_keys.append(key_obj.key)
                # Save the updated product with used keys
                await product_doc.save()
            item.assigned_keys = assigned_keys
            # item.assigned_key = assigned_key_to_item # This is now a list, so not needed
            # key_updated_in_product = True
            # break
    
    if not all_items_have_keys:
        current_order_status = StatusEnum.AWAITING_STOCK
    else:
        current_order_status = StatusEnum.PROCESSING # Or COMPLETED if payment is also handled

    order_data.status = current_order_status
    order_data.statusHistory.append(StatusHistoryEntry(status=current_order_status, date=datetime.now(timezone.utc)))
    order_data.createdAt = datetime.now(timezone.utc)
    order_data.updatedAt = datetime.now(timezone.utc)
    
    # --- Coupon Discount Logic ---
    original_total = sum(item.price * item.quantity for item in order_data.items)
    discount_amount = 0.0
    coupon_code = order_data.coupon_code
    coupon_obj = None
    coupon_error = None
    if coupon_code:
        coupon_service = CouponService(db)
        discount_amount, coupon_obj, coupon_error = await coupon_service.validate_and_apply_coupon(coupon_code, original_total)
        if coupon_error:
            print(f"Coupon error: {coupon_error}")
    order_data.discount_amount = discount_amount
    order_data.original_total = original_total
    order_data.total = original_total - discount_amount
    # --- End Coupon Discount Logic ---
    # Prepare order for insertion
    order_to_insert = order_data.model_dump(by_alias=True) # Use model_dump for Pydantic v2
    order_to_insert["_id"] = order_id_obj # Ensure _id is ObjectId

    insert_result = await db.orders.insert_one(order_to_insert)
    
    if not insert_result.inserted_id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create order")

    created_order = await db.orders.find_one({"_id": insert_result.inserted_id})
    # Ensure _id is a string for Pydantic validation
    if created_order and isinstance(created_order.get('_id'), ObjectId):
        created_order['_id'] = str(created_order['_id'])
    return Order(**created_order)

# ... (rest of the existing router code for get_orders, get_order, update_order_status, etc.)
# Ensure to add a new endpoint or a mechanism to retry failed orders.

async def retry_failed_orders_internal(db: Database, product_collection: ProductCollection):
    """
    Internal function to retry assigning keys to orders in 'AWAITING_STOCK' or 'FAILED' status.
    This would typically be called by a scheduled task or after a stock update.
    """
    orders_to_retry_cursor = db.orders.find({"status": {"$in": [StatusEnum.AWAITING_STOCK, StatusEnum.FAILED]}})
    async for order_doc in orders_to_retry_cursor:
        # Convert ObjectId to string for '_id' to satisfy Pydantic validation
        if '_id' in order_doc and not isinstance(order_doc['_id'], str):
            order_doc['_id'] = str(order_doc['_id'])
        order = Order(**order_doc)
        all_items_processed_successfully = True
        needs_update = False

        for item in order.items:
            # Check both assigned_key and assigned_keys (list)
            already_assigned = False
            if hasattr(item, 'assigned_keys') and item.assigned_keys:
                already_assigned = True
            if hasattr(item, 'assigned_key') and item.assigned_key:
                already_assigned = True
            if already_assigned:
                continue

            product = await product_collection.get_product_by_id(item.productId)
            if product and product.manages_cd_keys:
                # Assign as many keys as needed for the quantity
                assigned_keys = []
                available_keys = [k for k in product.cdKeys if not k.isUsed]
                if len(available_keys) >= item.quantity:
                    for i in range(item.quantity):
                        key_obj = available_keys[i]
                        key_obj.isUsed = True
                        key_obj.usedAt = datetime.now(timezone.utc)
                        key_obj.orderId = order.id
                        assigned_keys.append(key_obj.key)
                    # Save the updated product with used keys
                    await product.save()
                    item.assigned_keys = assigned_keys
                    needs_update = True
                    print(f"Retry successful: Keys assigned to item {item.productId} in order {order.id}")
                else:
                    all_items_processed_successfully = False
                    print(f"Retry failed: Not enough keys for item {item.productId} in order {order.id}")
                    break

        if needs_update: # If any key was assigned in this retry attempt
            if all_items_processed_successfully:
                new_status = StatusEnum.PROCESSING # Or COMPLETED, depending on your flow
                order.statusHistory.append(StatusHistoryEntry(status=new_status, date=datetime.now(timezone.utc), note="Key assigned on retry."))
            else:
                # If some items got keys but others didn't, it remains in AWAITING_STOCK or FAILED
                # Or you could introduce a new status like PARTIALLY_FULFILLED
                new_status = order.status # Keep current status if not all items fulfilled
                order.statusHistory.append(StatusHistoryEntry(status=order.status, date=datetime.now(timezone.utc), note="Partial key assignment on retry."))

            await db.orders.update_one(
                {"_id": ObjectId(order.id)},
                {"$set": {
                    "items": [i.model_dump() for i in order.items], 
                    "status": new_status,
                    "statusHistory": [sh.model_dump() for sh in order.statusHistory],
                    "updatedAt": datetime.now(timezone.utc)
                }}
            )

@router.post("/orders/retry-failed", status_code=status.HTTP_200_OK)
async def retry_failed_orders_endpoint(
    current_user: TokenData = Depends(get_current_user), # Secure this endpoint
    user_controller = Depends(get_user_controller_dependency),
    product_collection: ProductCollection = Depends(get_product_collection_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    db = await mongo_db.get_db()
    await retry_failed_orders_internal(db, product_collection)
    return {"message": "Retry process for failed orders initiated."}

# You'll also need an endpoint in admin_router.py or products_router.py to add new CD keys to a product.
# This will trigger the retry logic or allow manual retry.

# Example of how you might call retry_failed_orders_internal after adding keys (conceptual)
# This would typically be in the endpoint that handles adding/updating product keys.
# async def some_function_that_adds_keys_to_product(...):
#     # ... logic to add keys ...
#     db = await mongo_db.get_db()
#     product_collection = ProductCollection(db) # Or get from dependency
#     await retry_failed_orders_internal(db, product_collection)


# Make sure the existing get_orders, get_order, update_order_status are compatible
# with Pydantic v2 (e.g. using model_dump) and BSON ObjectId handling.

# GET /orders
@router.get("/orders", response_model=List[Order])
async def get_orders(
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    orders_cursor = db.orders.find()
    orders_from_db = await orders_cursor.to_list(length=None)
    
    processed_orders = []
    for order_doc in orders_from_db:
        if '_id' in order_doc and isinstance(order_doc['_id'], ObjectId):
            order_doc['_id'] = str(order_doc['_id'])  # Always stringify, do not pop or move to 'id'
        processed_orders.append(Order(**order_doc))
    return [order.model_dump(by_alias=True) for order in processed_orders]

# GET /orders/{order_id}
@router.get("/orders/{order_id}", response_model=Order)
async def get_order(
    order_id: str,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    try:
        obj_order_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")
        
    order_from_db = await db.orders.find_one({"_id": obj_order_id})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Ensure 'id' field is populated from '_id'
    if '_id' in order_from_db and isinstance(order_from_db['_id'], ObjectId):
        order_from_db['_id'] = str(order_from_db['_id'])
    return Order(**order_from_db).model_dump(by_alias=True)

# PUT /orders/{order_id}/status
@router.put("/orders/{order_id}/status", response_model=Order)
async def update_order_status(
    order_id: str, 
    status_update: OrderStatusUpdateRequest,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    try:
        obj_order_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")

    order_from_db = await db.orders.find_one({"_id": obj_order_id})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")

    # Create a new status history entry
    new_status_entry = StatusHistoryEntry(
        status=status_update.status,
        date=datetime.now(timezone.utc),
        note=status_update.note
    )
    
    # Update the order
    update_result = await db.orders.update_one(
        {"_id": obj_order_id},
        {
            "$set": {"status": status_update.status, "updatedAt": datetime.now(timezone.utc)},
            "$push": {"statusHistory": new_status_entry.model_dump()} # Use model_dump for Pydantic v2
        }
    )

    # If status is being set to Cancelled and it wasn't previously Cancelled, release keys
    previous_status = order_from_db.get('status')
    if status_update.status == StatusEnum.CANCELLED and previous_status != StatusEnum.CANCELLED:
        from .orders_key_release_utils import release_keys_for_order
        await release_keys_for_order(order_from_db, db)
        print(f"Order {order_id}: Released keys on cancel.")

    if update_result.modified_count == 0:
        # This might happen if the status is the same or order not found (already checked)
        # For simplicity, we'll refetch, but ideally, handle more gracefully
        pass

    updated_order_doc = await db.orders.find_one({"_id": obj_order_id})
    if not updated_order_doc: # Should not happen if previous checks passed
        raise HTTPException(status_code=404, detail="Order not found after update attempt.")

    if '_id' in updated_order_doc and isinstance(updated_order_doc['_id'], ObjectId):
        updated_order_doc['_id'] = str(updated_order_doc['_id'])
        
    return Order(**updated_order_doc)

@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: str,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    try:
        obj_order_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")

    order_from_db = await db.orders.find_one({"_id": obj_order_id})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")

    # Release keys before deleting
    await release_keys_for_order(order_from_db, db)
    print(f"Order {order_id}: Released keys before deletion.")
    await db.orders.delete_one({"_id": obj_order_id})
    return {"detail": "Order deleted and keys released."}

@router.patch("/orders/{order_id}", response_model=Order)
async def patch_order(
    order_id: str,
    order_update: dict,
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    if not await user_controller.has_role(current_user.username, Role.manager):
        raise HTTPException(status_code=403, detail="Admin access required")

    db = await mongo_db.get_db()
    try:
        obj_order_id = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid Order ID format")

    order_from_db = await db.orders.find_one({"_id": obj_order_id})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")

    # If status is being changed to Cancelled, release keys
    previous_status = order_from_db.get('status')
    new_status = order_update.get('status')
    if new_status == StatusEnum.CANCELLED and previous_status != StatusEnum.CANCELLED:
        from .orders_key_release_utils import release_keys_for_order
        await release_keys_for_order(order_from_db, db)
        print(f"Order {order_id}: Released keys on cancel (PATCH endpoint).")

    # Update the order with provided fields
    update_fields = {k: v for k, v in order_update.items() if k != '_id'}
    update_fields['updatedAt'] = datetime.now(timezone.utc)
    await db.orders.update_one({"_id": obj_order_id}, {"$set": update_fields})

    updated_order_doc = await db.orders.find_one({"_id": obj_order_id})
    if '_id' in updated_order_doc and isinstance(updated_order_doc['_id'], ObjectId):
        updated_order_doc['_id'] = str(updated_order_doc['_id'])
    return Order(**updated_order_doc).model_dump(by_alias=True)
