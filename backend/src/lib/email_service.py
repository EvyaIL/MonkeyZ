import requests
import logging
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

## EmailJS removed. Please use FastAPI backend or SMTP for all email sending.
        
        if response.status_code != 200:
            logging.error(f"[EMAILJS] Error sending {template_type} email: {response.status_code} - {response.text}")
            return False
            
        logging.info(f"[EMAILJS] Successfully sent {template_type} email")
        return True
    except requests.exceptions.RequestException as e:
        logging.error(f"[EMAILJS] Request failed for {template_type} email: {e}")
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
