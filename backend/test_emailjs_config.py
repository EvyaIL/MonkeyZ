import os
import logging
import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

def test_emailjs_config():
    """Test if all required EmailJS variables are set."""
    required_vars = [
        "EMAILJS_SERVICE_ID",
        "EMAILJS_USER_ID",
        "EMAILJS_TEMPLATE_ID_PASSWORD_RESET",
        "EMAILJS_TEMPLATE_ID_OTP",
        "EMAILJS_TEMPLATE_ID_WELCOME"
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing_vars.append(var)
            logging.error(f"❌ Missing environment variable: {var}")
        else:
            logging.info(f"✅ Found environment variable: {var} = {value[:5]}...")
    
    if missing_vars:
        logging.error(f"Missing {len(missing_vars)} EmailJS environment variables")
        return False
    
    logging.info("All EmailJS environment variables are set")
    return True

def test_send_test_email(recipient_email=None):
    """Send a test email using EmailJS to verify the configuration."""
    if not recipient_email:
        logging.warning("No recipient email provided, skipping sending test")
        return None
    
    EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"
    service_id = os.getenv("EMAILJS_SERVICE_ID")
    user_id = os.getenv("EMAILJS_USER_ID")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID_WELCOME")  # Using welcome template for test
    
    if not all([service_id, user_id, template_id]):
        logging.error("Missing required EmailJS variables, cannot send test email")
        return False
    
    template_params = {
        "to_email": recipient_email,
        "username": "Test User",
        "email": recipient_email,
        "company_name": "MonkeyZ"
    }
    
    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": user_id,
        "template_params": template_params
    }
    
    try:
        logging.info(f"Sending test email to {recipient_email}")
        response = requests.post(EMAILJS_API_URL, json=payload)
        logging.info(f"EmailJS Response: {response.status_code} {response.text}")
        
        if response.status_code == 200:
            logging.info("✅ Test email sent successfully!")
            return True
        else:
            logging.error(f"❌ Failed to send test email: {response.text}")
            return False
    
    except Exception as e:
        logging.error(f"Exception when sending test email: {str(e)}")
        return False

if __name__ == "__main__":
    logging.info("Testing EmailJS configuration")
    config_result = test_emailjs_config()
    
    if config_result:
        # To send an actual test email, uncomment and add your email
        # test_send_test_email("your_email@example.com")
        logging.info("To send a test email, edit this script and uncomment the test_send_test_email line")
    
    logging.info("EmailJS configuration test complete")
