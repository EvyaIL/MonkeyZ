from typing import Dict
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime

def send_payment_confirmation(payment_data: Dict) -> None:
    """
    Send a payment confirmation email to the customer
    """
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    
    if not all([smtp_host, smtp_user, smtp_pass]):
        print("Email configuration not found")
        return
    
    # Create message
    msg = MIMEMultipart()
    msg["Subject"] = "Payment Confirmation - MonkeyZ"
    msg["From"] = "orders@monkeyz.co.il"
    msg["To"] = payment_data.get("email", "")
    
    # Create email body
    body = f"""
    שלום {payment_data.get('customer_name', '')},
    
    תודה על רכישתך באתר MonkeyZ!
    
    פרטי העסקה:
    מספר עסקה: {payment_data.get('transaction_id', '')}
    סכום: {payment_data.get('payment_sum', 0)} ₪
    אמצעי תשלום: {payment_data.get('payment_method', '')}
    מספר תשלומים: {payment_data.get('number_of_payments', 1)}
    תאריך: {datetime.now().strftime('%d/%m/%Y %H:%M')}
    
    בברכה,
    צוות MonkeyZ
    """
    
    msg.attach(MIMEText(body, "plain", "utf-8"))
    
    # Send email
    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")

def update_order_status(transaction_id: str, status: str) -> None:
    """
    Update order status in database
    TODO: Implement based on your database schema
    """
    pass
