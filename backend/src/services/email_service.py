import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List

# Email configuration from environment
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USER"),
    MAIL_PASSWORD=os.getenv("SMTP_PASS"),
    MAIL_FROM=os.getenv("SMTP_FROM"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER=os.getenv("SMTP_HOST"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

class EmailService:
    async def send_order_email(
        self,
        to: str,
        subject: str,
        products: List[dict],
        keys: List[str]
    ):
        # Build HTML body for digital products
        body = "<h1>Thank you for your purchase!</h1>"
        for item, key in zip(products, keys):
            name = item.get("name") or item.get("id")
            body += f"<p>{name} &mdash; Your license key: <strong>{key}</strong></p>"
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
            # Suppress email send failures; log and continue without impacting order flow
            import logging
            logging.warning(f"Email send failed for {to}, ignoring: {e}")
            return True
    
    async def send_pending_stock_email(
        self,
        to: str,
        order_id: str
    ):
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
