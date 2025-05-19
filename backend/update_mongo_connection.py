#!/usr/bin/env python3
# filepath: update_mongo_connection.py

import os
import sys
import logging
from dotenv import load_dotenv
from pymongo import MongoClient, errors

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def verify_connection(uri):
    """Verify if a MongoDB URI is valid by attempting to connect"""
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')  # Will raise exception if connection fails
        logger.info("✓ Connection successful!")
        return True
    except errors.ServerSelectionTimeoutError:
        logger.error("× Server selection timeout: MongoDB server not reachable")
        return False
    except errors.OperationFailure as e:
        if "Authentication failed" in str(e):
            logger.error("× Authentication failed: Invalid credentials")
        else:
            logger.error(f"× Operation failure: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"× Unexpected error: {str(e)}")
        return False

def format_mongodb_uri(original_uri):
    """Format MongoDB URI for better compatibility with DigitalOcean"""
    try:
        if not original_uri:
            return None
        
        # Already in minimum format
        if '?' not in original_uri or ('authSource=admin' in original_uri and '&' not in original_uri):
            return original_uri
            
        # Parse the URI
        auth_host_part = original_uri.split('?')[0]
        
        # Simplify to just authSource=admin
        return f"{auth_host_part}?authSource=admin"
    except Exception as e:
        logger.error(f"Error formatting URI: {str(e)}")
        return original_uri

def update_env_for_digital_ocean():
    """Create or update .env.digital-ocean file with simplified MongoDB URI"""
    load_dotenv()
    
    try:
        # Get the original URI
        original_uri = os.getenv("MONGODB_URI", "")
        if not original_uri:
            logger.error("MONGODB_URI not set in environment variables")
            return False
            
        # Format the URI for better compatibility
        simplified_uri = format_mongodb_uri(original_uri)
        
        # Test the connection
        logger.info("Testing connection with original URI...")
        original_works = verify_connection(original_uri)
        
        if original_works:
            logger.info("Original URI works fine!")
        else:
            logger.info("Testing connection with simplified URI...")
            simplified_works = verify_connection(simplified_uri)
            
            if simplified_works:
                logger.info("Simplified URI works!")
            else:
                logger.error("Both original and simplified URIs failed.")
                logger.info("Please check your MongoDB credentials or network connection.")
                return False
        
        # Create or update .env.digital-ocean
        env_digital_ocean_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env.digital-ocean")
        
        env_vars = {
            "HOST": "0.0.0.0",
            "PORT": "${_self.PORT}",
            "ALGORITHM": "HS256",  # No quotes needed in DigitalOcean
            "ACCESS_TOKEN_EXPIRE_MINUTES": os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"),
            "SECRET_KEY": os.getenv("SECRET_KEY", "").replace('"', ''),  # Remove quotes
            "CORS_ORIGINS": f"{os.getenv('CORS_ORIGINS', '')},${APP_URL}",
            "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID", ""),
            "GROW_API_KEY": os.getenv("GROW_API_KEY", ""),
            "MONGODB_URI": simplified_uri if not original_works and simplified_works else original_uri,
            "EMAILJS_SERVICE_ID": os.getenv("EMAILJS_SERVICE_ID", ""),
            "EMAILJS_USER_ID": os.getenv("EMAILJS_USER_ID", ""),
            "EMAILJS_TEMPLATE_ID_PASSWORD_RESET": os.getenv("EMAILJS_TEMPLATE_ID_PASSWORD_RESET", "")
        }
        
        # Write to .env.digital-ocean
        with open(env_digital_ocean_path, 'w') as f:
            f.write("# Digital Ocean Environment Configuration\n")
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
                
            f.write("\n# Note: For DigitalOcean App Platform, do not use quotes around values\n")
            f.write("# Remember to check 'Encrypt' for sensitive values like MONGODB_URI, SECRET_KEY, etc.\n")
            
        logger.info(f"Created {env_digital_ocean_path} with {'simplified' if not original_works and simplified_works else 'original'} MongoDB URI")
        logger.info("Please use these settings in your DigitalOcean App Platform environment variables.")
        
        return True
    except Exception as e:
        logger.error(f"Error updating .env.digital-ocean: {str(e)}")
        return False

if __name__ == "__main__":
    success = update_env_for_digital_ocean()
    sys.exit(0 if success else 1)
