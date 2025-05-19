import requests
import logging

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Sends a password reset email using EmailJS.

    Args:
        to_email (str): Recipient's email address.
        reset_link (str): Reset link to be included in the email.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"
    EMAILJS_SERVICE_ID = "service_xheer8t"
    EMAILJS_TEMPLATE_ID = "template_9f1h1dn"  # Password Reset Template ID
    EMAILJS_USER_ID = "OZANGbTigZyYpNfAT"       # Your EmailJS User ID (Public Key)

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
        "user_id": EMAILJS_USER_ID,
        "template_params": template_params,
    }

    logging.info(f"[EMAILJS] Sending password reset email to {to_email} with link: {reset_link} using template: {EMAILJS_TEMPLATE_ID}")
    logging.info(f"[EMAILJS] Payload: {payload}")
    response = requests.post(EMAILJS_API_URL, json=payload)
    logging.info(f"[EMAILJS] Response: {response.status_code} {response.text}")
    print("EmailJS response:", response.status_code, response.text)  # Debug line
    if response.status_code != 200:
        print(f"Error sending password reset email: {response.status_code} - {response.text}")
    return response.status_code == 200

def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Sends an OTP email using EmailJS.

    Args:
        to_email (str): Recipient's email address.
        otp (str): One Time Password to be included in the email.

    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    EMAILJS_API_URL = "https://api.emailjs.com/api/v1.0/email/send"
    EMAILJS_SERVICE_ID = "service_xheer8t"
    EMAILJS_TEMPLATE_ID = "template_fi5fm2c"    # OTP Template ID
    EMAILJS_USER_ID = "OZANGbTigZyYpNfAT"         # Your EmailJS User ID (Public Key)

    # Adjust these params if your OTP template uses specific placeholders
    # For example, if your OTP template is "Your OTP is {{otp_value}}"
    # then template_params should be {"to_email": to_email, "otp_value": otp}
    template_params = {
        "to_email": to_email, # Standard EmailJS param
        "otp": otp,           # Assuming your OTP template uses {{otp}}
        "company_name": "MonkeyZ" # If your OTP template also uses company name
    }
    
    # If your OTP template is structured like the password reset one, 
    # you might need to pass more specific parameters.
    # For now, I'm assuming it might use {{otp}} and {{company_name}}.
    # The previous version sent a full 'body'. If your OTP template expects that,
    # you'll need to revert the template_params for this function or adjust your template.

    payload = {
        "service_id": EMAILJS_SERVICE_ID,
        "template_id": EMAILJS_TEMPLATE_ID,
        "user_id": EMAILJS_USER_ID,
        "template_params": template_params
    }

    logging.info(f"[EMAILJS] Sending OTP email to {to_email} with otp: {otp} using template: {EMAILJS_TEMPLATE_ID}")
    logging.info(f"[EMAILJS] Payload: {payload}")
    response = requests.post(EMAILJS_API_URL, json=payload)
    logging.info(f"[EMAILJS] Response: {response.status_code} {response.text}")
    print("EmailJS response:", response.status_code, response.text)  # Debug line
    if response.status_code != 200:
        print(f"Error sending OTP email: {response.status_code} - {response.text}")
    return response.status_code == 200
