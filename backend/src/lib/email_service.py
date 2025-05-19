import requests
import logging
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"
# Load credentials from environment variables
EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID")
EMAILJS_USER_ID = os.getenv("EMAILJS_USER_ID")
# It's good practice to also have a fallback or raise an error if critical env vars are missing
if not EMAILJS_SERVICE_ID or not EMAILJS_USER_ID:
    logging.error("[EMAILJS] Service ID or User ID is missing from environment variables.")
    # Depending on desired behavior, you might raise an exception here
    # raise ValueError("EmailJS credentials are not set in environment variables")

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Sends a password reset email using EmailJS.

    Args:
        to_email (str): Recipient's email address.
        reset_link (str): Reset link to be included in the email.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    EMAILJS_TEMPLATE_ID = os.getenv("EMAILJS_TEMPLATE_ID_PASSWORD_RESET")
    if not EMAILJS_TEMPLATE_ID:
        logging.error("[EMAILJS] Password Reset Template ID is missing from environment variables.")
        return False
    if not EMAILJS_SERVICE_ID or not EMAILJS_USER_ID: # Check again in case they were not set at module load
        logging.error("[EMAILJS] Service ID or User ID is missing. Cannot send email.")
        return False
        
    # Parameters to pass to your EmailJS template
    # These keys MUST match the placeholders in your EmailJS template (e.g., {{link}}, {{email}}, {{company_name}})
    template_params = {
        "to_email": to_email,  # Standard EmailJS param, often used for the 'To' field
        "email": to_email,     # For the {{email}} placeholder in your template content
        "link": reset_link,    # For the {{link}} placeholder
        "company_name": "MonkeyZ" # For the [Company Name] placeholder
    }

    payload = {
        "service_id": EMAILJS_SERVICE_ID,
        "template_id": EMAILJS_TEMPLATE_ID,
        "user_id": EMAILJS_USER_ID, # This is typically the Public Key
        # "accessToken": os.getenv("EMAILJS_PRIVATE_KEY"), # Uncomment if using Access Token
        "template_params": template_params,
    }

    logging.info(f"[EMAILJS] Sending password reset email to {to_email} with link: {reset_link} using template: {EMAILJS_TEMPLATE_ID}")
    logging.info(f"[EMAILJS] Payload: {payload}")
    try:
        response = requests.post(EMAILJS_API_URL, json=payload)
        logging.info(f"[EMAILJS] Response: {response.status_code} {response.text}")
        print("EmailJS response:", response.status_code, response.text)  # Debug line
        if response.status_code != 200:
            print(f"Error sending password reset email: {response.status_code} - {response.text}")
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        logging.error(f"[EMAILJS] Request failed: {e}")
        print(f"Error sending password reset email (request failed): {e}")
        return False

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends an OTP email using EmailJS.

    Args:
        to_email (str): Recipient's email address.
        otp (str): One Time Password to be included in the email.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    EMAILJS_TEMPLATE_ID = os.getenv("EMAILJS_TEMPLATE_ID_OTP")
    if not EMAILJS_TEMPLATE_ID:
        logging.error("[EMAILJS] OTP Template ID is missing from environment variables.")
        return False
    if not EMAILJS_SERVICE_ID or not EMAILJS_USER_ID: # Check again
        logging.error("[EMAILJS] Service ID or User ID is missing. Cannot send OTP email.")
        return False

    template_params = {
        "to_email": to_email, 
        "otp": otp,          
        "company_name": "MonkeyZ"
    }
    
    payload = {
        "service_id": EMAILJS_SERVICE_ID,
        "template_id": EMAILJS_TEMPLATE_ID,
        "user_id": EMAILJS_USER_ID, # Public Key
        # "accessToken": os.getenv("EMAILJS_PRIVATE_KEY"), # Uncomment if using Access Token
        "template_params": template_params
    }

    logging.info(f"[EMAILJS] Sending OTP email to {to_email} with otp: {otp} using template: {EMAILJS_TEMPLATE_ID}")
    logging.info(f"[EMAILJS] Payload: {payload}")
    try:
        response = requests.post(EMAILJS_API_URL, json=payload)
        logging.info(f"[EMAILJS] Response: {response.status_code} {response.text}")
        print("EmailJS response:", response.status_code, response.text)  # Debug line
        if response.status_code != 200:
            print(f"Error sending OTP email: {response.status_code} - {response.text}")
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        logging.error(f"[EMAILJS] Request failed during OTP send: {e}")
        print(f"Error sending OTP email (request failed): {e}")
        return False
