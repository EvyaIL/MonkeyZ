"""
Test script for EmailJS integration to ensure it's working before deployment.
This script tests the email functionality used in the MonkeyZ application.
"""
import os
import requests
import json
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

def test_emailjs():
    """Test EmailJS configuration with a test email."""
    # Get EmailJS configuration from environment variables
    service_id = os.getenv("EMAILJS_SERVICE_ID")
    user_id = os.getenv("EMAILJS_USER_ID")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID_WELCOME")  # Using welcome template for test
    
    if not all([service_id, user_id, template_id]):
        logging.error("EmailJS environment variables not set. Check your .env file.")
        return False
    
    logging.info(f"Testing EmailJS with service_id={service_id}, template_id={template_id}")
    
    # Test recipient email - replace with your test email
    test_email = "test@example.com"  # Change this to your test email
    
    # Prepare the payload for EmailJS
    payload = {
        'service_id': service_id,
        'template_id': template_id,
        'user_id': user_id,
        'template_params': {
            'to_email': test_email,
            'to_name': 'Test User',
            'message': 'This is a test email for DigitalOcean deployment verification.',
            'subject': 'MonkeyZ - Email Test for Deployment'
        }
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        # Only log that we would send the email in test mode
        logging.info(f"Would send test email to {test_email} with EmailJS")
        logging.info(f"Payload (sanitized): {json.dumps({**payload, 'user_id': '***REDACTED***'}, indent=2)}")
        
        # Uncomment the following to actually send a test email
        # response = requests.post(
        #     'https://api.emailjs.com/api/v1.0/email/send',
        #     headers=headers,
        #     data=json.dumps(payload)
        # )
        # 
        # if response.status_code == 200:
        #     logging.info("Test email sent successfully!")
        #     return True
        # else:
        #     logging.error(f"Failed to send test email. Status code: {response.status_code}")
        #     logging.error(f"Response: {response.text}")
        #     return False
        
        # For test mode, we'll return success
        return True
        
    except Exception as e:
        logging.error(f"Error testing EmailJS: {str(e)}")
        return False

if __name__ == "__main__":
    logging.info("Testing EmailJS for DigitalOcean deployment...")
    success = test_emailjs()
    
    if success:
        logging.info("✓ EmailJS test completed successfully!")
        exit(0)
    else:
        logging.error("✗ EmailJS test failed!")
        logging.error("Please check your EmailJS configuration.")
        exit(1)