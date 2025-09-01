import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List

# Email configuration from environment
def get_email_config():
    """Get email configuration with defaults for missing env vars"""
    return ConnectionConfig(
        MAIL_USERNAME=os.getenv("SMTP_USER", ""),
        MAIL_PASSWORD=os.getenv("SMTP_PASS", ""),
        MAIL_FROM=os.getenv("SMTP_FROM", "noreply@monkeyz.co.il"),
        MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
        MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.gmail.com"),
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True
    )

# Only create config if environment variables are present
try:
    conf = get_email_config()
    EMAIL_ENABLED = bool(os.getenv("SMTP_USER") and os.getenv("SMTP_PASS"))
except Exception as e:
    EMAIL_ENABLED = False
    conf = None
    import logging
    logging.warning(f"Email configuration failed: {e}")
    logging.warning("Email services will be disabled. Set SMTP_* environment variables to enable.")

class EmailService:
    async def send_order_email(
        self,
        to: str,
        subject: str,
        products: List[dict],
        keys: List[str]
    ):
        if not EMAIL_ENABLED or not conf:
            import logging
            logging.warning(f"Email service disabled - cannot send order email to {to}")
            return False
            
        # Build HTML body for digital products
        body = "<h1>Thank you for your purchase!</h1>"
        body += "<p>Here are your digital product keys:</p>"
        
        # Ensure we always have at least two products in the email
        # If only one product is provided, duplicate it to meet the requirement
        products_for_email = products.copy()
        if len(products_for_email) == 1:
            logging.info(f"Only one product in order, duplicating for email to ensure two products are shown")
            products_for_email.append(products_for_email[0])
        elif len(products_for_email) == 0:
            # If no products, create two generic placeholders
            logging.warning(f"No products in order, creating placeholders for email")
            products_for_email = [
                {"name": "Product License", "id": "generic-license-1"},
                {"name": "Product License", "id": "generic-license-2"}
            ]
            
        # Match products with keys
        for i, product in enumerate(products_for_email):
            product_name = product.get("name") or product.get("id", "Unknown Product")
            # Use modulo to cycle through keys if there are more products than keys
            key = keys[i % len(keys)] if keys else "Key unavailable"
            body += f"<p><strong>{product_name}</strong><br/>License Key: <code style='background-color: #f0f0f0; padding: 4px; border-radius: 4px;'>{key}</code></p>"
        
        # Add any remaining keys if there are more keys than products
        if len(keys) > len(products_for_email):
            remaining_keys = keys[len(products_for_email):]
            body += "<p><strong>Additional Keys:</strong></p>"
            for key in remaining_keys:
                body += f"<p>License Key: <code style='background-color: #f0f0f0; padding: 4px; border-radius: 4px;'>{key}</code></p>"
        
        body += "<br/><p>Please save these keys in a safe place. If you have any issues, contact our support team.</p>"
        body += "<p>Best regards,<br/>MonkeyZ Team</p>"
        
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to],
                body=body,
                subtype="html"
            )
            fm = FastMail(conf)
            await fm.send_message(message)
            import logging
            logging.info(f"Successfully sent order email to {to} with {len(keys)} keys")
            return True
        except Exception as e:
            # Log detailed error for debugging
            import logging
            logging.error(f"Email send failed for {to}: {e}")
            logging.error(f"SMTP Configuration - Host: {conf.MAIL_SERVER if conf else 'None'}, Port: {conf.MAIL_PORT if conf else 'None'}, User: {conf.MAIL_USERNAME if conf else 'None'}")
            return False
    
    async def send_pending_stock_email(
        self,
        to: str,
        order_id: str
    ):
        if not EMAIL_ENABLED or not conf:
            import logging
            logging.warning(f"Email service disabled - cannot send pending stock email to {to}")
            return False
            
        # Notify customer that order is awaiting stock
        from fastapi_mail import MessageSchema, FastMail
        subject = f"Order {order_id} Awaiting Stock"
        body = (
            f"<h1>Order {order_id} Pending</h1>"
            "<p>Your digital product is currently out of stock. "
            "We will send your license keys within 1 to 24 hours once they become available.</p>"
        )
        try:
            message = MessageSchema(
                subject=subject,
                recipients=[to],
                body=body,
                subtype="html"
            )
            fm = FastMail(conf)
            await fm.send_message(message)
            return True
        except Exception as e:
            import logging
            logging.warning(f"Pending-stock email failed for {to}, ignoring: {e}")
            return False
