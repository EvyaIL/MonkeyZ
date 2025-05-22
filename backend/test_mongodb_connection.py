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
        "serverSelectionTimeoutMS": 30000,  # Increased from 15000
        "connectTimeoutMS": 60000,          # Increased from 30000
        "socketTimeoutMS": 90000,           # Increased from 45000
        "retryWrites": True,
        "retryReads": True,
        "directConnection": False,          # Ensure we're not trying direct connection
        "tlsAllowInvalidCertificates": False  # Ensure TLS verification is enabled
    }
    
    max_retries = 3
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            logging.info(f"Connection attempt {attempt + 1} of {max_retries}")
            
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
            logging.error(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                logging.info(f"Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
            else:
                logging.error("All connection attempts failed")
                logging.error("Please verify:")
                logging.error("1. Your MongoDB cluster is running on DigitalOcean")
                logging.error("2. The connection string in .env is correct")
                logging.error("3. Your IP is allowed in the firewall rules")
                logging.error("4. The database user and password are correct")
                return False

if __name__ == "__main__":
    # For DigitalOcean deployment, verify MongoDB connection
    logging.info("Testing MongoDB connection for DigitalOcean deployment...")
    result = asyncio.run(test_mongodb_connection())
    
    if result:
        logging.info("✅ MongoDB connection test successful! Ready for deployment.")
        exit(0)
    else:
        logging.error("❌ MongoDB connection test failed! Check your connection string and network.")
        logging.error("For DigitalOcean deployment, ensure you're using the correct connection string from the DO dashboard.")
        exit(1)
