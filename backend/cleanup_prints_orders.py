#!/usr/bin/env python3
"""
Script to replace all print statements in orders.py with proper logging
"""
import re
import os

def replace_print_statements(file_path):
    """Replace all print statements with appropriate logging"""
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Define replacement patterns
    replacements = [
        # Email error
        (r'print\(f"Failed to send CD key email: {e}"\)', 'logger.error("Failed to send CD key email: %s", e)'),
        
        # Retry messages
        (r'print\(f"Retry successful: Keys assigned to item {item\.productId} in order {order\.id}"\)', 'logger.info("Retry successful: Keys assigned to item %s in order %s", item.productId, order.id)'),
        (r'print\(f"Retry failed: Not enough keys for item {item\.productId} in order {order\.id}"\)', 'logger.warning("Retry failed: Not enough keys for item %s in order %s", item.productId, order.id)'),
        
        # Error parsing order
        (r'print\(f"Error parsing order {order_doc\.get\(\'_id\'\)}: {e}"\)', 'logger.error("Error parsing order %s: %s", order_doc.get(\'_id\'), e)'),
        
        # Order operations
        (r'print\(f"Order {order_id}: Released keys on cancel\."\)', 'logger.info("Order %s: Released keys on cancel", order_id)'),
        (r'print\(f"Order {order_id}: Recalculated coupon analytics for {coupon_code} after cancellation\."\)', 'logger.info("Order %s: Recalculated coupon analytics for %s after cancellation", order_id, coupon_code)'),
        (r'print\(f"Order {order_id}: Recalculated coupon analytics for {coupon_code} after uncancellation\."\)', 'logger.info("Order %s: Recalculated coupon analytics for %s after uncancellation", order_id, coupon_code)'),
        (r'print\(f"Order {order_id}: Released keys before deletion\."\)', 'logger.info("Order %s: Released keys before deletion", order_id)'),
        (r'print\(f"Order {order_id}: Recalculated coupon analytics for {coupon_code} after deletion\."\)', 'logger.info("Order %s: Recalculated coupon analytics for %s after deletion", order_id, coupon_code)'),
        (r'print\(f"Order {order_id}: Released keys on cancel \(PATCH endpoint\)\."\)', 'logger.info("Order %s: Released keys on cancel (PATCH endpoint)", order_id)'),
        (r'print\(f"Order {order_id}: Recalculated coupon analytics for {coupon_code} after patch\."\)', 'logger.info("Order %s: Recalculated coupon analytics for %s after patch", order_id, coupon_code)'),
        
        # PayPal order errors
        (r'print\(f"\[PayPal Order\] ERROR: {error_msg}"\)', 'logger.error("PayPal Order validation error: %s", error_msg)'),
        (r'print\("\[PayPal Order\] ERROR: No valid items in cart after validation\. Incoming cart:", cart\)', 'logger.error("PayPal Order: No valid items in cart after validation. Cart: %s", cart)'),
        
        # PayPal debugging
        (r'print\(f"Creating PayPal order with body: {req\.request_body}"\) # Added for debugging', 'logger.debug("Creating PayPal order with body: %s", req.request_body)'),
        (r'print\("Successfully created PayPal order\."\) # Added for debugging', 'logger.info("Successfully created PayPal order")'),
        (r'print\(f"Error creating PayPal order: {e}"\) # Added for debugging', 'logger.error("Error creating PayPal order: %s", e)'),
        
        # PayPal capture
        (r'print\(f"Capturing PayPal order {order_id}\.\.\."\)', 'logger.info("Capturing PayPal order %s", order_id)'),
        (r'print\(f"Successfully captured PayPal order {order_id}\. Status: {cap_resp\.result\.status}"\)', 'logger.info("Successfully captured PayPal order %s. Status: %s", order_id, cap_resp.result.status)'),
        (r'print\(f"Error capturing PayPal order {order_id}: {e}"\)', 'logger.error("Error capturing PayPal order %s: %s", order_id, e)'),
        
        # Order not found
        (r'print\(f"Order not found in database with _id={order_id}"\)', 'logger.warning("Order not found in database with _id=%s", order_id)'),
    ]
    
    # Apply all replacements
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    # Write back if changed
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Successfully updated {file_path}")
        print(f"📊 Replaced {len([p for p, r in replacements if re.search(p, original_content)])} print statements")
    else:
        print(f"ℹ️  No changes needed in {file_path}")

if __name__ == "__main__":
    file_path = "src/routers/orders.py"
    if os.path.exists(file_path):
        replace_print_statements(file_path)
    else:
        print(f"❌ File not found: {file_path}")
