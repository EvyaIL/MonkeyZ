import requests
import logging
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"

# Load EmailJS configuration from environment variables
EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID")
EMAILJS_USER_ID = os.getenv("EMAILJS_USER_ID")
EMAILJS_PRIVATE_KEY = os.getenv("EMAILJS_PRIVATE_KEY")

# Template IDs
TEMPLATE_IDS = {
    "auto_reply": os.getenv("EMAILJS_TEMPLATE_ID_AUTO_REPLY"),
    "contact_us": os.getenv("EMAILJS_TEMPLATE_ID_CONTACT_US"),
    "otp": os.getenv("EMAILJS_TEMPLATE_ID_OTP"),
    "password_reset": os.getenv("EMAILJS_TEMPLATE_ID_PASSWORD_RESET"),
    "welcome": os.getenv("EMAILJS_TEMPLATE_ID_WELCOME")
}

def validate_emailjs_config() -> bool:
    """Validate all required EmailJS configuration is present."""
    missing_vars = []
    if not EMAILJS_SERVICE_ID:
        missing_vars.append("EMAILJS_SERVICE_ID")
    if not EMAILJS_USER_ID:
        missing_vars.append("EMAILJS_USER_ID")
    if not EMAILJS_PRIVATE_KEY:
        missing_vars.append("EMAILJS_PRIVATE_KEY")
    
    # Check template IDs
    for name, template_id in TEMPLATE_IDS.items():
        if not template_id:
            missing_vars.append(f"EMAILJS_TEMPLATE_ID_{name.upper()}")

    if missing_vars:
        logging.error(f"[EMAILJS] Missing environment variables: {', '.join(missing_vars)}")
        return False
    return True

# Validate config on module load
is_emailjs_configured = validate_emailjs_config()

def _send_email(template_type: str, template_params: dict) -> bool:
    """
    Internal function to send an email using EmailJS.

    Args:
        template_type (str): Type of template to use (e.g., 'password_reset', 'welcome')
        template_params (dict): Parameters to pass to the template

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    if not is_emailjs_configured:
        logging.error("[EMAILJS] Configuration is incomplete. Cannot send email.")
        return False

    template_id = TEMPLATE_IDS.get(template_type)
    if not template_id:
        logging.error(f"[EMAILJS] Template ID for {template_type} not found")
        return False

    # Add common template parameters
    template_params["company_name"] = "MonkeyZ"

    payload = {
        "service_id": EMAILJS_SERVICE_ID,
        "template_id": template_id,
        "user_id": EMAILJS_USER_ID,
        "accessToken": EMAILJS_PRIVATE_KEY,
        "template_params": template_params
    }

    try:
        response = requests.post(EMAILJS_API_URL, json=payload)
        logging.info(f"[EMAILJS] {template_type} email response: {response.status_code}")
        
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
