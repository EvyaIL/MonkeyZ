#!/usr/bin/env python3
# filepath: test_mongodb_connection.py
import os
import sys
import logging
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConfigurationError, OperationFailure
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_connection():
    """Test MongoDB connection with detailed error handling"""
    # Load environment variables from .env file
    load_dotenv()
    
    # Get MongoDB URI from environment
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        logger.error("MONGODB_URI environment variable is not set")
        return False
    
    logger.info(f"Testing connection with URI: {mongo_uri[:20]}...{mongo_uri[-20:] if len(mongo_uri) > 40 else ''}") 
    
    # Connection options with longer timeouts
    options = {
        "serverSelectionTimeoutMS": 15000,
        "connectTimeoutMS": 30000,
        "socketTimeoutMS": 45000,
        "retryWrites": True,
        "w": "majority",
        "maxPoolSize": 10,
        "minPoolSize": 1
    }
    
    try:
        # Attempt to create client and connect
        client = AsyncIOMotorClient(mongo_uri, **options)
        
        # Try to ping the server
        logger.info("Pinging MongoDB server...")
        await client.admin.command('ping')
        
        # Get server info
        server_info = await client.admin.command('serverStatus')
        logger.info(f"Successfully connected to MongoDB version: {server_info.get('version', 'unknown')}")
        
        # Get database list
        database_names = await client.list_database_names()
        logger.info(f"Available databases: {', '.join(database_names)}")
        
        # Test if we can access the 'admin' database specifically
        logger.info("Testing access to 'admin' database...")
        try:
            await client.admin.command('listCollections')
            logger.info("Successfully accessed 'admin' database")
        except Exception as e:
            logger.warning(f"Could not access 'admin' database: {str(e)}")
        
        return True
    except ConfigurationError as e:
        logger.error(f"MongoDB configuration error: {str(e)}")
        logger.info("This usually indicates an issue with the connection string format")
        return False
    except OperationFailure as e:
        logger.error(f"MongoDB operation failure: {str(e)}")
        if "Authentication failed" in str(e):
            logger.info("TIPS: Check your username and password. Make sure the user exists and has the right permissions.")
            # Suggest a fix for DigitalOcean MongoDB
            logger.info("If using DigitalOcean MongoDB, try creating a new database user with a simple password")
        return False
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {str(e)}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_connection())
    sys.exit(0 if result else 1)
