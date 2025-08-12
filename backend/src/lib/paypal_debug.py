# PayPal Error Debugging and Fix Tool
import os
import logging
from paypalcheckoutsdk.core import PayPalHttpClient, SandboxEnvironment, LiveEnvironment
from paypalcheckoutsdk.orders import OrdersCreateRequest, OrdersCaptureRequest

logger = logging.getLogger(__name__)

def debug_paypal_configuration():
    """Debug PayPal configuration and identify issues"""
    
    paypal_mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
    logger.info(f"=== PayPal Configuration Debug ===")
    logger.info(f"PayPal Mode: {paypal_mode}")
    
    # Check credentials
    if paypal_mode == "live":
        client_id = os.getenv("PAYPAL_LIVE_CLIENT_ID")
        client_secret = os.getenv("PAYPAL_LIVE_CLIENT_SECRET")
        env_type = "LIVE"
    else:
        client_id = os.getenv("PAYPAL_CLIENT_ID")
        client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
        env_type = "SANDBOX"
        
    logger.info(f"Environment: {env_type}")
    logger.info(f"Client ID configured: {bool(client_id)}")
    logger.info(f"Client Secret configured: {bool(client_secret)}")
    
    if client_id:
        logger.info(f"Client ID preview: {client_id[:10]}...")
    
    # Common issues
    issues = []
    
    if not client_id:
        issues.append(f"Missing {env_type} Client ID")
    if not client_secret:
        issues.append(f"Missing {env_type} Client Secret")
        
    # Check for common configuration mistakes
    if paypal_mode == "live" and client_id and "sandbox" in client_id.lower():
        issues.append("Using sandbox credentials in live mode")
        
    if paypal_mode == "sandbox" and client_id and "live" in client_id.lower():
        issues.append("Using live credentials in sandbox mode")
        
    if issues:
        logger.error("PayPal Configuration Issues:")
        for issue in issues:
            logger.error(f"  - {issue}")
    else:
        logger.info("PayPal configuration appears correct")
        
    return {
        "mode": paypal_mode,
        "client_id_configured": bool(client_id),
        "client_secret_configured": bool(client_secret),
        "issues": issues
    }

def create_paypal_test_order():
    """Create a test PayPal order to verify configuration"""
    
    try:
        config = debug_paypal_configuration()
        
        if config["issues"]:
            return {"error": "Configuration issues found", "issues": config["issues"]}
        
        # Initialize PayPal client
        paypal_mode = config["mode"]
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
        
        client = PayPalHttpClient(environment)
        
        # Create test order
        request = OrdersCreateRequest()
        request.prefer("return=representation")
        
        # Use USD for testing (ILS might have issues in sandbox)
        test_currency = "USD" if paypal_mode == "sandbox" else "ILS"
        
        request.request_body({
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {
                    "currency_code": test_currency,
                    "value": "1.00"
                },
                "description": "Test Order - PayPal Configuration Check"
            }],
            "application_context": {
                "cancel_url": "https://monkeyz.co.il/cancel",
                "return_url": "https://monkeyz.co.il/success"
            }
        })
        
        response = client.execute(request)
        
        if response.result:
            return {
                "success": True,
                "order_id": response.result.id,
                "status": response.result.status,
                "currency": test_currency,
                "mode": paypal_mode
            }
        else:
            return {"error": "No response from PayPal"}
            
    except Exception as e:
        logger.error(f"PayPal test order failed: {str(e)}")
        return {
            "error": str(e),
            "type": type(e).__name__
        }

# Enhanced PayPal order creation with better error handling
def create_enhanced_paypal_order(cart_items, total_amount, currency="USD"):
    """
    Create PayPal order with enhanced error handling and validation
    """
    
    try:
        # Debug configuration first
        config_debug = debug_paypal_configuration()
        if config_debug["issues"]:
            raise Exception(f"PayPal configuration issues: {', '.join(config_debug['issues'])}")
        
        # Initialize PayPal client
        paypal_mode = config_debug["mode"]
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
        
        client = PayPalHttpClient(environment)
        
        # Validate inputs
        if not cart_items:
            raise ValueError("Cart cannot be empty")
            
        if total_amount <= 0:
            raise ValueError("Total amount must be greater than 0")
        
        # Format amount to 2 decimal places
        formatted_amount = f"{float(total_amount):.2f}"
        
        # Create order request
        request = OrdersCreateRequest()
        request.prefer("return=representation")
        
        # Build purchase units
        purchase_units = [{
            "amount": {
                "currency_code": currency,
                "value": formatted_amount,
                "breakdown": {
                    "item_total": {
                        "currency_code": currency,
                        "value": formatted_amount
                    }
                }
            },
            "items": []
        }]
        
        # Add items to purchase units
        for item in cart_items:
            item_name = item.get("name", "Product")
            item_quantity = item.get("quantity", 1)
            item_price = f"{float(item.get('price', 0)):.2f}"
            
            purchase_units[0]["items"].append({
                "name": item_name[:127],  # PayPal has a 127 character limit
                "unit_amount": {
                    "currency_code": currency,
                    "value": item_price
                },
                "quantity": str(item_quantity),
                "category": "DIGITAL_GOODS"
            })
        
        request.request_body({
            "intent": "CAPTURE",
            "purchase_units": purchase_units,
            "application_context": {
                "brand_name": "MonkeyZ",
                "landing_page": "BILLING",
                "shipping_preference": "NO_SHIPPING",
                "user_action": "PAY_NOW",
                "cancel_url": "https://monkeyz.co.il/cancel",
                "return_url": "https://monkeyz.co.il/success"
            }
        })
        
        # Execute request
        logger.info(f"Creating PayPal order with amount: {formatted_amount} {currency}")
        response = client.execute(request)
        
        if response.result:
            logger.info(f"PayPal order created successfully: {response.result.id}")
            return {
                "success": True,
                "order_id": response.result.id,
                "status": response.result.status,
                "amount": formatted_amount,
                "currency": currency
            }
        else:
            raise Exception("Empty response from PayPal")
            
    except Exception as e:
        logger.error(f"Enhanced PayPal order creation failed: {str(e)}")
        
        # Provide specific error messages for common issues
        error_message = str(e)
        if "INVALID_RESOURCE_ID" in error_message:
            error_message = "PayPal order creation failed. Please check your PayPal configuration and try again."
        elif "CURRENCY_NOT_SUPPORTED" in error_message:
            error_message = f"Currency {currency} is not supported. Try using USD instead."
        elif "AUTHENTICATION_FAILURE" in error_message:
            error_message = "PayPal authentication failed. Please check your PayPal credentials."
        
        return {
            "success": False,
            "error": error_message,
            "error_type": type(e).__name__
        }
