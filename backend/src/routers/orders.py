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
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest
import os
from ..services.email_service import EmailService
from datetime import datetime, timezone

# Initialize PayPal client
paypal_mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
print(f"Initializing PayPal client in {paypal_mode} mode.") # Added for debugging
if paypal_mode == "live":
    environment = LiveEnvironment(
        client_id=os.getenv("PAYPAL_LIVE_CLIENT_ID"),
        client_secret=os.getenv("PAYPAL_LIVE_CLIENT_SECRET")
    )
else:
    environment = SandboxEnvironment(
        client_id=os.getenv("PAYPAL_CLIENT_ID"),
        client_secret=os.getenv("PAYPAL_CLIENT_SECRET")
    )
print(f"Using PayPal Client ID: {environment.client_id[:8]}... for {paypal_mode} mode") # Added for debugging
paypal_client = PayPalHttpClient(environment)

router = APIRouter()

# Customer: fetch authenticated user's own orders
@router.get("/orders/user", response_model=List[Order])
async def get_user_orders(
    current_user: TokenData = Depends(get_current_user)
):
    db = await mongo_db.get_db()
    cursor = db.orders.find({"email": current_user.username})
    orders = await cursor.to_list(length=None)
    # Convert ObjectId to string
    for doc in orders:
        if '_id' in doc and isinstance(doc['_id'], ObjectId):
            doc['_id'] = str(doc['_id'])
    return [Order(**doc).model_dump(by_alias=True) for doc in orders]

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
            key_obj.orderId = order_id  # Store order ID as string
            item.assigned_keys = [key_obj.key]  # Assign key(s) to order item
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
        current_order_status = StatusEnum.COMPLETED

    order_data.status = current_order_status
    order_data.statusHistory.append(StatusHistoryEntry(status=current_order_status, date=datetime.now(timezone.utc)))
    order_data.createdAt = datetime.now(timezone.utc)
    order_data.updatedAt = datetime.now(timezone.utc)
    
    # --- Coupon Discount Logic ---
    original_total = sum(item.price * item.quantity for item in order_data.items)
    discount_amount = 0.0
    # Support both coupon_code and couponCode from frontend
    coupon_code = getattr(order_data, 'coupon_code', None) or getattr(order_data, 'couponCode', None)
    coupon_obj = None
    coupon_error = None
    if coupon_code:
        coupon_service = CouponService(db)
        discount_amount, coupon_obj, coupon_error = await coupon_service.validate_and_apply_coupon(coupon_code, original_total)
        if coupon_error:
            print(f"Coupon error: {coupon_error}")
        else:
            # Enforce maxUsagePerUser before incrementing usage
            if coupon_obj:
                user_email = order_data.email
                max_usage_per_user = coupon_obj.get('maxUsagePerUser', 0)
                user_usages = coupon_obj.get('userUsages', {})
                user_usage_count = user_usages.get(user_email, 0) if user_email else 0
                if max_usage_per_user and user_usage_count >= max_usage_per_user:
                    raise HTTPException(status_code=400, detail=f"Coupon usage limit per user reached ({max_usage_per_user})")
                # Update total usage
                await db.coupons.update_one({"code": coupon_code}, {"$inc": {"usageCount": 1, "usageAnalytics.total": 1, "usageAnalytics.pending": 1}})
                # Update per-user usage
                if user_email:
                    await db.coupons.update_one({"code": coupon_code}, {"$inc": {f"userUsages.{user_email}": 1}})
                print(f"Coupon {coupon_code} usage incremented for order {order_data.id}")
    order_data.discount_amount = discount_amount
    order_data.original_total = original_total
    order_data.total = original_total - discount_amount
    # Always set coupon_code (Pydantic alias will handle couponCode in DB)
    if coupon_code:
        order_data.coupon_code = coupon_code
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

    # Send CD key(s) by email and SMS/WhatsApp if order is completed and keys assigned
    if created_order.get('status') == StatusEnum.COMPLETED:
        user_email = created_order.get('email')
        assigned_keys = []
        products = []
        for item in created_order.get('items', []):
            if 'assigned_keys' in item and item['assigned_keys']:
                assigned_keys.extend(item['assigned_keys'])
                products.append({"name": item.get("name", "Product"), "id": item.get("productId")})
        if assigned_keys:
            # Send email using correct signature
            try:
                email_service = EmailService()
                await email_service.send_order_email(
                    to=user_email,
                    subject=f"Your Order {created_order.get('_id')} - CD Key(s)",
                    products=products,
                    keys=assigned_keys
                )
            except Exception as e:
                print(f"Failed to send CD key email: {e}")
            # Send SMS/WhatsApp (pseudo-code, replace with your actual service)
            try:
                from ..services.sms_service import send_sms_whatsapp
                await send_sms_whatsapp(
                    to=user_email, # Replace with user's phone number if available
                    message=f"Your CD Key(s): {', '.join(assigned_keys)}"
                )
            except Exception as e:
                print(f"Failed to send CD key SMS/WhatsApp: {e}")

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
@router.get("/orders")  # Temporarily return raw JSON to avoid Pydantic validation errors
async def get_orders(
    current_user: TokenData = Depends(get_current_user),
    user_controller = Depends(get_user_controller_dependency)
):
    try:
        if not await user_controller.has_role(current_user.username, Role.manager):
            raise HTTPException(status_code=403, detail="Admin access required")

        db = await mongo_db.get_db()
        orders_cursor = db.orders.find()
        orders_from_db = await orders_cursor.to_list(length=None)
        
        processed_orders = []
        for order_doc in orders_from_db:
            # If this is a PayPal order (has cart but no items), normalize it
            if 'items' not in order_doc and 'cart' in order_doc:
                # Map cart to items
                order_doc['items'] = [
                    { 'productId': i.get('id'), 'name': '', 'quantity': i.get('quantity'), 'price': i.get('price'), 'assigned_keys': i.get('assigned_keys', []) }
                    for i in order_doc['cart']
                ]
                # Fill other required fields
                order_doc['customerName'] = ''
                order_doc['email'] = order_doc.get('customerEmail')
                created_at = order_doc.get('createdAt')
                order_doc['date'] = created_at
                order_doc['statusHistory'] = [ { 'status': order_doc.get('status'), 'date': created_at } ]
                order_doc['total'] = order_doc.get('totalPaid') or (order_doc.get('originalTotal', 0) - order_doc.get('discountAmount', 0))
                order_doc['updatedAt'] = created_at
                order_doc['coupon_code'] = order_doc.get('couponCode')
                order_doc['discount_amount'] = order_doc.get('discountAmount')
                order_doc['original_total'] = order_doc.get('originalTotal')
            # Convert ObjectId to string for Pydantic
            if '_id' in order_doc and isinstance(order_doc['_id'], ObjectId):
                order_doc['_id'] = str(order_doc['_id'])
            # If cart present, merge assigned_keys into items for PayPal orders
            if 'cart' in order_doc and 'items' in order_doc:
                for c in order_doc['cart']:
                    pid = c.get('id')
                    keys = c.get('assigned_keys', [])
                    for itm in order_doc['items']:
                        if itm.get('productId') == pid:
                            itm['assigned_keys'] = keys
            # Ensure email is a valid string
            if not isinstance(order_doc.get('email'), str):
                order_doc['email'] = order_doc.get('customerEmail') or order_doc.get('customer_email') or ''
            # Sanitize item names
            for itm in order_doc.get('items', []):
                nm = itm.get('name')
                if not isinstance(nm, str):
                    if isinstance(nm, dict):
                        itm['name'] = nm.get('en') or next(iter(nm.values()), '')
                    else:
                        itm['name'] = str(nm)
            # Map coupon and discount fields
            order_doc['coupon_code'] = order_doc.get('coupon_code') or order_doc.get('couponCode')
            order_doc['discount_amount'] = order_doc.get('discount_amount') or order_doc.get('discountAmount')
            order_doc['original_total'] = order_doc.get('original_total') or order_doc.get('originalTotal')
            try:
                processed_orders.append(Order(**order_doc))
            except Exception as e:
                print(f"Error parsing order {order_doc.get('_id')}: {e}")
                continue
        return [order.model_dump(by_alias=True) for order in processed_orders]
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error retrieving orders: {e}")

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

    previous_status = order_from_db.get('status')
    coupon_code = order_from_db.get('couponCode') or order_from_db.get('coupon_code')
    # If status is being set to Cancelled and it wasn't previously Cancelled, release keys and decrement coupon usage
    if status_update.status == StatusEnum.CANCELLED.value and previous_status != StatusEnum.CANCELLED.value:
        from .orders_key_release_utils import release_keys_for_order
        await release_keys_for_order(order_from_db, db)
        print(f"Order {order_id}: Released keys on cancel.")
        if coupon_code:
            # Always decrement usageCount by 1 (never below zero)
            await db.coupons.update_one({"code": coupon_code, "usageCount": {"$gt": 0}}, {"$inc": {"usageCount": -1, "usageAnalytics.cancelled": 1, "usageAnalytics.pending": -1}})
            # Decrement per-user usage if needed (optional, usually not decremented)
            print(f"Order {order_id}: Decremented usage for coupon {coupon_code} (cancelled).")
    # If status is being changed from Cancelled to any other status, increment coupon usage
    if previous_status == StatusEnum.CANCELLED.value and status_update.status != StatusEnum.CANCELLED.value:
        if coupon_code:
            await db.coupons.update_one({"code": coupon_code}, {"$inc": {"usageCount": 1, "usageAnalytics.total": 1, f"usageAnalytics.{status_update.status}": 1, "usageAnalytics.cancelled": -1}})
            # Update per-user usage
            if order_from_db.get('email'):
                await db.coupons.update_one({"code": coupon_code}, {"$inc": {f"userUsages.{order_from_db.get('email')}": 1}})
            print(f"Order {order_id}: Incremented usage for coupon {coupon_code} (uncancelled).")

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
    # Support both ObjectId and string IDs
    query_id = order_id
    try:
        query_id = ObjectId(order_id)
    except Exception:
        pass
    order_from_db = await db.orders.find_one({"_id": query_id})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")

    # --- Decrement Coupon Usage on Deletion or Cancel ---
    coupon_code = order_from_db.get("couponCode") or order_from_db.get("coupon_code")
    if coupon_code:
        await db.coupons.update_one({"code": coupon_code}, {"$inc": {"usageCount": -1}})
        print(f"Order {order_id}: Decremented usage for coupon {coupon_code}.")
    # --- End Coupon Logic ---

    # Release keys before deleting
    await release_keys_for_order(order_from_db, db)
    print(f"Order {order_id}: Released keys before deletion.")
    await db.orders.delete_one({"_id": query_id})
    return {"detail": "Order deleted, keys released, and coupon usage updated."}

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
    # Support both ObjectId and string IDs
    query_id = order_id
    try:
        query_id = ObjectId(order_id)
    except Exception:
        pass
    order_from_db = await db.orders.find_one({"_id": query_id})
    if not order_from_db:
        raise HTTPException(status_code=404, detail="Order not found")

    # If status is being changed to Cancelled, release keys
    previous_status = order_from_db.get('status')
    new_status = order_update.get('status')
    if new_status == StatusEnum.CANCELLED.value and previous_status != StatusEnum.CANCELLED.value:
        from .orders_key_release_utils import release_keys_for_order
        await release_keys_for_order(order_from_db, db)
        print(f"Order {order_id}: Released keys on cancel (PATCH endpoint).")

    # Update the order with provided fields
    update_fields = {k: v for k, v in order_update.items() if k != '_id'}
    update_fields['updatedAt'] = datetime.now(timezone.utc)
    await db.orders.update_one({"_id": query_id}, {"$set": update_fields})

    updated_order_doc = await db.orders.find_one({"_id": query_id})
    if '_id' in updated_order_doc and isinstance(updated_order_doc['_id'], ObjectId):
        updated_order_doc['_id'] = str(updated_order_doc['_id'])
    return Order(**updated_order_doc).model_dump(by_alias=True)

# --- PayPal Integration Endpoints ---
@router.post("/paypal/orders", tags=["orders"])
async def create_paypal_order(
    payload: dict,
    product_collection: ProductCollection = Depends(get_product_collection_dependency)
):
    cart = payload.get("cart", [])
    coupon_code = payload.get("couponCode")
    customer_email = payload.get("customerEmail")
    customer_name = payload.get("customerName")
    phone = payload.get("phone")

    # --- Item Validation and Sanitization ---
    valid_items_for_db = []
    if not cart:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart cannot be empty.")

    for c in cart:
        product_id = c.get("productId") or c.get("id")
        if not product_id:
            print(f"Skipping cart item because it is missing a product ID: {c}")
            continue
            
        prod = await product_collection.get_product_by_id(product_id)
        if not prod:
            print(f"Skipping cart item because product with ID {product_id} was not found.")
            continue
        
        # Sanitize product name to string
        raw_name = prod.name if hasattr(prod, 'name') else ""
        if isinstance(raw_name, dict):
            name_str = raw_name.get('en') or next(iter(raw_name.values()), "")
        else:
            name_str = str(raw_name)

        # Use price from DB to prevent tampering, quantity from cart
        quantity = c.get("quantity", 0)
        if quantity > 0:
            valid_items_for_db.append({
                "productId": str(prod.id), # Use the sanitized product ID from DB
                "name": name_str,
                "quantity": quantity,
                "price": prod.price, # Use price from DB
                "assigned_keys": []
            })

    if not valid_items_for_db:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart contains no valid items.")

    # Calculate original total from validated items
    original_total = sum(item.get("price", 0) * item.get("quantity", 0) for item in valid_items_for_db)
    
    # Validate coupon (no usage increment)
    coupon_service = CouponService((await mongo_db.get_db()))
    discount, _, _ = await coupon_service.validate_coupon(coupon_code, original_total)
    net_total = original_total - discount

    # Build PayPal order in ILS for net total
    req = OrdersCreateRequest()
    req.prefer("return=representation")
    req.request_body({
        "intent": "CAPTURE",
        "purchase_units": [{
            "amount": {"currency_code": "ILS", "value": f"{net_total:.2f}"}
        }]
    })
    try:
        print(f"Creating PayPal order with body: {req.request_body}") # Added for debugging
        resp = paypal_client.execute(req)
        print("Successfully created PayPal order.") # Added for debugging
    except Exception as e:
        print(f"Error creating PayPal order: {e}") # Added for debugging
        raise HTTPException(status_code=502, detail=f"PayPal create order failed: {e}")
    order_id = resp.result.id
    # Save PENDING order with discount info
    # Prepare order document with items and totals
    db = await mongo_db.get_db()
    now = datetime.now(timezone.utc)

    # Insert PENDING order using the validated items
    await db.orders.insert_one({
        "_id": order_id,
        "items": valid_items_for_db, # Use the validated and sanitized items
        "total": net_total,
        "originalTotal": original_total,
        "discountAmount": discount,
        "couponCode": coupon_code,
        "customerName": customer_name,
        "email": customer_email,
        "phone": phone,
        "status": StatusEnum.PENDING.value,
        "statusHistory": [{"status": StatusEnum.PENDING.value, "date": now}],
        "createdAt": now,
        "updatedAt": now
    })
    return {"id": order_id}

@router.post("/paypal/orders/{order_id}/capture", tags=["orders"])
async def capture_paypal_order(
    order_id: str,
    product_collection: ProductCollection = Depends(get_product_collection_dependency)
):
    """
    Capture PayPal payment, apply coupon, assign keys, update stock, send email, finalize order.
    """
    db = await mongo_db.get_db()
    # Capture payment
    cap_req = OrdersCaptureRequest(order_id)
    cap_req.prefer("return=representation")
    try:
        print(f"Capturing PayPal order {order_id}...") # Added for debugging
        cap_resp = paypal_client.execute(cap_req)
        print(f"Successfully captured PayPal order {order_id}.") # Added for debugging
    except Exception as e:
        print(f"Error capturing PayPal order {order_id}: {e}") # Added for debugging
        # Mark order as cancelled on capture failure
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"status": StatusEnum.CANCELLED.value, "updatedAt": datetime.now(timezone.utc)}}
        )
        raise HTTPException(status_code=502, detail=f"PayPal capture order failed: {e}")
    # Allow sandbox PENDING captures (if Payment Review off, sandbox may still return PENDING)
    capture_status = cap_resp.result.status
    if capture_status not in ("COMPLETED", "PENDING"):
        # Mark as cancelled for other statuses
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"status": StatusEnum.CANCELLED.value, "updatedAt": datetime.now(timezone.utc)}}
        )
        raise HTTPException(status_code=400, detail=f"Payment not completed, status: {capture_status}")
    # Treat PENDING as successful in sandbox
    final_status = "COMPLETED"

    order_doc = await db.orders.find_one({"_id": order_id})
    if not order_doc:
        raise HTTPException(404, "Order not found")
    # Validate coupon without incrementing usage
    from ..services.coupon_service import CouponService
    svc = CouponService(db)
    discount, coupon_obj, error = await svc.validate_coupon(
        order_doc.get("couponCode"),
        sum(i.get("price", 0) * i.get("quantity", 0) for i in order_doc.get("items", []))
    )
    # Assign CD keys for digital products
    all_items_have_keys = True
    items = order_doc.get("items", [])
    for item in items:
        product = await product_collection.get_product_by_id(item.get("productId"))
        if not product or not product.manages_cd_keys:
            continue # Skip non-digital products or products not found

        available_keys = [k for k in product.cdKeys if not k.isUsed]
        if len(available_keys) < item.get("quantity", 0):
            all_items_have_keys = False
            break # No need to check other items, we already know it's awaiting stock

    # If stock is available, proceed with assignment
    if all_items_have_keys:
        for item in items:
            assigned_keys = []
            quantity = item.get("quantity", 0)
            for _ in range(quantity):
                # sanitize name field to ensure string input
                raw_name = item.get("name", "")
                if isinstance(raw_name, dict):
                    name_str = raw_name.get("en") or next(iter(raw_name.values()), "")
                else:
                    name_str = str(raw_name)
                oi = OrderItem(
                    productId=item.get("productId"),
                    name=name_str,
                    quantity=1,
                    price=item.get("price")
                )
                # This function modifies the product in the DB and assigns keys to `oi`
                assigned = await assign_key_to_order_item(order_id, oi, product_collection, db)
                if assigned and getattr(oi, 'assigned_keys', []):
                    assigned_keys.extend(oi.assigned_keys)
                else:
                    # This case should theoretically not be hit if the pre-check passed,
                    # but as a safeguard:
                    all_items_have_keys = False
            item["assigned_keys"] = assigned_keys
    
    # Determine final status based on key assignment
    status_value = StatusEnum.COMPLETED.value if all_items_have_keys else StatusEnum.AWAITING_STOCK.value
    
    # If fully completed, increment coupon usage
    if status_value == StatusEnum.COMPLETED.value and coupon_obj:
        _, _, _ = await svc.validate_and_apply_coupon(
            order_doc.get("couponCode"),
            sum(i.get("price", 0) * i.get("quantity", 0) for i in items)
        )
    # Update order in DB with status, discount, totalPaid, and assigned keys
    paid_amount = float(cap_resp.result.purchase_units[0].payments.captures[0].amount.value)
    # Compute fallback discount (original - paid) if coupon discount not applied
    orig_total = order_doc.get("originalTotal", order_doc.get("total", 0))
    computed_discount = round(orig_total - paid_amount, 2)
    # Use coupon discount if present, otherwise fallback to computed
    final_discount = discount if discount and discount > 0 else computed_discount
    await db.orders.update_one(
        {"_id": order_id},
        {"$set": {
            "status": status_value,
            "capturedAt": datetime.now(timezone.utc),
            "discountAmount": final_discount,
            "totalPaid": paid_amount,
            "items": items
        }}
    )
    # Send email only if order completed
    if status_value == StatusEnum.COMPLETED.value:
        email_service = EmailService()
        all_keys = []
        for item in items:
            all_keys.extend(item.get("assigned_keys", []))
        recipient = order_doc.get("email") or order_doc.get("customerEmail")
        sent = await email_service.send_order_email(
            to=recipient,
            subject="Your MonkeyZ Digital Products",
            products=items,
            keys=all_keys
        )
        if not sent:
            print(f"Failed to send order email for order {order_id}")
    return {"message": f"Order {status_value.lower()}"}

@router.post("/paypal/orders/{order_id}/cancel", tags=["orders"])
async def cancel_paypal_order(order_id: str):
    """Endpoint to mark a PayPal order as cancelled when payment is aborted."""
    db = await mongo_db.get_db()
    # Update order status to Cancelled
    update_result = await db.orders.update_one(
        {"_id": order_id},
        {"$set": {"status": StatusEnum.CANCELLED.value, "updatedAt": datetime.now(timezone.utc)}}
    )
    if update_result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found or already updated")
    return {"message": "Order cancelled"}
