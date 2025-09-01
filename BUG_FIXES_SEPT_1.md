# Bug Fixes - September 1, 2025

## Bug Fix 1: Coupon Usage Limit Display on Frontend

### Problem
When a user exceeded their max usage limit for a coupon, the frontend still displayed a discount and didn't clearly communicate that the coupon couldn't be used again by that specific user.

### Solution
1. Enhanced the backend API `/api/coupons/validate` to return detailed information about:
   - Total coupon usage count and limits
   - Per-user usage count and limits
   - Whether the current user has already used the coupon

2. Updated the frontend checkout page to:
   - Check if the user has already used the coupon
   - Display a clear message when a user has reached their max usage limit
   - Set the discount to zero if the user has exceeded their limit
   - Show warnings for coupons that are close to being fully used

### How to Test
1. Create a coupon with `maxUsagePerUser` set to 1
2. Apply the coupon once with a specific email address
3. Try to apply the same coupon with the same email address again
4. The frontend should show "You've already used this coupon X time(s). No additional discounts available."
5. Verify the discount is set to zero

## Bug Fix 2: Handling Out-of-Stock Products

### Problem
When products were not in stock, users weren't properly notified, and there was no mechanism to send them their CD keys when stock was updated.

### Solution
1. Enhanced the `send_pending_stock_email` function to include:
   - More detailed product information
   - Better formatting and explanations
   - Clear expectations about when keys will be available

2. Modified order processing to:
   - Send an initial email when an order is set to AWAITING_STOCK status
   - Include product details in the notification email
   - Log successful email sending or any errors

3. Enhanced the `retry_failed_orders` function to:
   - Send a follow-up email when stock becomes available
   - Include all the newly assigned CD keys
   - Only send emails for fully processed orders
   - Handle different email field variations in the order data

### How to Test
1. Create a product with limited or no CD keys available
2. Place an order for this product
3. Verify that a "pending stock" email is sent
4. Add CD keys to the product
5. Run the retry_failed_orders function (automatically runs periodically or can be triggered manually)
6. Verify that the customer receives a follow-up email with their CD keys

## Implementation Details

### Files Modified
- `frontend/src/pages/Checkout.jsx`
- `backend/src/routers/admin_router.py`
- `backend/src/services/email_service.py`
- `backend/src/routers/orders.py`

### New Features Added
- More detailed coupon usage tracking
- Improved email notifications for out-of-stock products
- Better user feedback when coupon limits are reached
- Automatic follow-up emails when products become available
