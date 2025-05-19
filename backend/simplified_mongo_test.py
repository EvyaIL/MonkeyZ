#!/usr/bin/env python3
# filepath: simplified_mongo_test.py
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_simplified_connection():
    """Test MongoDB connection with a simplified URI"""
    load_dotenv()
    
    # Get the base URI components
    original_uri = os.getenv("MONGODB_URI", "")
    
    if not original_uri:
        logger.error("MONGODB_URI not found in environment variables")
        return False
        
    # Try to parse the URI
    try:
        # Extract the parts
        if '@' in original_uri:
            # Format: mongodb+srv://username:password@host/database?options
            auth_part = original_uri.split('@')[0] + '@'
            host_part = original_uri.split('@')[1].split('/')[0]
            db_part = original_uri.split('/')[-1].split('?')[0]
            
            # Create simplified connection string variations to try
            variations = [
                # Original URI
                original_uri,
                
                # Without tls
                original_uri.replace('?tls=true', ''),
                
                # Without replicaSet
                original_uri.split('replicaSet')[0].rstrip('&'),
                
                # Most basic form
                f"{auth_part}{host_part}/{db_part}?authSource=admin",
                
                # With only authSource
                f"{auth_part}{host_part}/{db_part}?authSource=admin",
                
                # Try different database
                f"{auth_part}{host_part}/admin?authSource=admin"
            ]
            
            # Try each variation
            for i, uri in enumerate(variations):
                logger.info(f"Trying variation {i+1}...")
                try:
                    # Connect with simple options
                    client = AsyncIOMotorClient(
                        uri,
                        serverSelectionTimeoutMS=5000
                    )
                    
                    # Test the connection
                    await client.admin.command('ping')
                    logger.info(f"✓ Connection successful with variation {i+1}!")
                    logger.info(f"Working MongoDB URI: {uri}")
                    
                    # If this works, update the .env.digital-ocean file
                    env_path = ".env.digital-ocean"
                    if os.path.exists(env_path):
                        with open(env_path, 'r') as f:
                            content = f.read()
                        
                        # Replace the MongoDB URI line
                        new_content = content.replace(
                            original_uri,
                            uri
                        )
                        
                        with open(env_path, 'w') as f:
                            f.write(new_content)
                        logger.info(f"Updated {env_path} with working URI")
                    
                    return True
                except Exception as e:
                    logger.error(f"Error with variation {i+1}: {str(e)}")
                    continue
            
            logger.error("All connection variations failed")
            return False
        else:
            logger.error("Invalid MongoDB URI format")
            return False
            
    except Exception as e:
        logger.error(f"Error parsing MongoDB URI: {str(e)}")
        return False

if __name__ == "__main__":
    asyncio.run(test_simplified_connection())
