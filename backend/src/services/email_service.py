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
        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=body,
            subtype="html"
        )
        fm = FastMail(conf)
        await fm.send_message(message)
