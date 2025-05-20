import asyncio
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

async def test_mongodb_connection():
    """Test the MongoDB connection with the URI from environment variables."""
    mongo_uri = os.getenv("MONGODB_URI")
    
    if not mongo_uri:
        logging.error("MONGODB_URI environment variable is not set.")
        return False
    
    logging.info(f"Testing connection to MongoDB (hiding credentials)")
    
    # Connection options for DigitalOcean Managed MongoDB
    connection_options = {
        "serverSelectionTimeoutMS": 15000, 
        "connectTimeoutMS": 30000, 
        "socketTimeoutMS": 45000,
        "retryWrites": True,
        "retryReads": True,
    }
    
    try:
        # Create client
        client = AsyncIOMotorClient(mongo_uri, **connection_options)
        
        # Test connection with ping
        await client.admin.command('ping')
        
        # List databases (additional test)
        database_names = await client.list_database_names()
        logging.info(f"Connected successfully! Available databases: {database_names}")
        
        # Close connection
        client.close()
        return True
    
    except Exception as e:
        logging.error(f"Failed to connect to MongoDB: {str(e)}")
        return False

if __name__ == "__main__":
    logging.info("Starting MongoDB connection test")
    result = asyncio.run(test_mongodb_connection())
    
    if result:
        logging.info("✅ MongoDB connection test PASSED")
    else:
        logging.error("❌ MongoDB connection test FAILED")
