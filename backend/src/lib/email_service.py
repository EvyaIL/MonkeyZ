import smtplib
import logging
import os
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()  # Load environment variables from .env file

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM")

def _send_email(template_type: str, template_params: dict) -> bool:
    """
    Send an email using SMTP based on template type and params.
    """
    try:
        subject = "MonkeyZ Notification"
        body = ""
        # Basic template logic (customize as needed)
        if template_type == "password_reset":
            subject = "Password Reset Request"
            body = f"Hello,\n\nClick the link to reset your password: {template_params.get('link')}\n\nIf you did not request this, ignore this email."
        elif template_type == "otp":
            subject = "Your One-Time Password (OTP)"
            body = f"Hello,\n\nYour OTP is: {template_params.get('otp')}\n\nDo not share this code."
        elif template_type == "welcome":
            subject = "Welcome to MonkeyZ!"
            body = f"Hello {template_params.get('username', '')},\n\nWelcome to MonkeyZ! We're glad to have you."
        elif template_type == "contact_us":
            subject = "Contact Form Submission"
            body = f"Name: {template_params.get('from_name', '')}\nEmail: {template_params.get('to_email', '')}\nMessage: {template_params.get('message', '')}"
        elif template_type == "auto_reply":
            subject = template_params.get('subject', 'Auto Reply')
            body = template_params.get('message', '')
        else:
            body = str(template_params)

        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM
        msg['To'] = template_params.get('to_email', SMTP_FROM)
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_FROM, [msg['To']], msg.as_string())
        logging.info(f"[SMTP] Successfully sent {template_type} email to {msg['To']}")
        return True
    except Exception as e:
        logging.error(f"[SMTP] Error sending {template_type} email: {e}")
        return False

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Send a password reset email.
    
    Args:
        to_email (str): Recipient's email address
        reset_link (str): Password reset link
    """
    template_params = {
        "to_email": to_email,
        "email": to_email,
        "link": reset_link
    }
    return _send_email("password_reset", template_params)

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send a one-time password email.
    
    Args:
        to_email (str): Recipient's email address
        otp (str): One-time password
    """
    template_params = {
        "to_email": to_email,
        "otp": otp
    }
    return _send_email("otp", template_params)

def send_welcome_email(to_email: str, username: str) -> bool:
    """
    Send a welcome email.
    
    Args:
        to_email (str): Recipient's email address
        username (str): User's username
    """
    template_params = {
        "to_email": to_email,
        "email": to_email,
        "username": username
    }
    return _send_email("welcome", template_params)

def send_contact_email(to_email: str, name: str, message: str) -> bool:
    """
    Send a contact form email.
    
    Args:
        to_email (str): Recipient's email address
        name (str): Sender's name
        message (str): Message content
    """
    template_params = {
        "to_email": to_email,
        "from_name": name,
        "message": message
    }
    return _send_email("contact_us", template_params)

def send_auto_reply_email(to_email: str, subject: str, message: str) -> bool:
    """
    Send an auto-reply email.
    
    Args:
        to_email (str): Recipient's email address
        subject (str): Email subject
        message (str): Message content
    """
    template_params = {
        "to_email": to_email,
        "subject": subject,
        "message": message
    }
    return _send_email("auto_reply", template_params)
