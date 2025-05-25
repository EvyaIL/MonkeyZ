import os
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClient
from beanie import init_beanie
from beanie import Document, Indexed
from pydantic import Field, condecimal
from typing import Optional
from datetime import datetime

class MongoDb:
    """
        A class for interacting with a MongoDB database
    """

    def __init__(self) -> None:
        """
            Initializes the MongoDb class with no client initially connected.
        """
        self.client: AsyncIOMotorClient = None
        self.db: AsyncIOMotorDatabase = None
        self.is_connected: bool = False

    async def connection(self) -> None:
        """
        Establishes a connection to the MongoDB server using the MONGODB_URI environment variable.
        """
        if self.is_connected:
            return

        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            logging.error("MONGODB_URI environment variable is not set.")
            raise ValueError("MONGODB_URI environment variable is not set.")
        
        # For DigitalOcean VPC, ensure the URI uses the private hostname and correct credentials
        if not is_valid_mongodb_uri(mongo_uri):
            logging.error("MONGODB_URI has an invalid format.")
            raise ValueError("MONGODB_URI has an invalid format. Please check your connection string.")
        
        try:
            logging.info(f"Connecting to MongoDB at: {mongo_uri[:30]}...") # Log only part of the URI for security
            
            # DigitalOcean MongoDB connection options - needed for proper replicaset handling
            connection_options = {
                "serverSelectionTimeoutMS": 15000, 
                "connectTimeoutMS": 30000, 
                "socketTimeoutMS": 45000,
                "retryWrites": True,
                "retryReads": True,
                "tlsAllowInvalidCertificates": False,  # Set to True only if using self-signed certs
                "directConnection": False  # Important for replica sets
            }
            
            # Check if replicaSet parameter is in URI, add it if missing (DigitalOcean requires this)
            if ("replicaSet=" not in mongo_uri) and ("mongodb+srv://" in mongo_uri):
                hostname = mongo_uri.split('@')[1].split('/')[0]
                
                # Handle public vs private DigitalOcean MongoDB URIs
                if "private-mongodb" in hostname:
                    # For private VPC URIs
                    cluster_id = hostname.split('-')[2] if len(hostname.split('-')) > 2 else "rs0"
                    replica_set = f"rs-{cluster_id}"
                else:
                    # For public URIs, the replica set name is usually the first part of the hostname
                    cluster_id = hostname.split('-')[0] if '-' in hostname else "mongodb"
                    replica_set = cluster_id
                
                # If there's a query string, append to it
                if "?" in mongo_uri:
                    mongo_uri = mongo_uri.replace("?", f"?replicaSet={replica_set}&")
                else:
                    mongo_uri = f"{mongo_uri}?replicaSet={replica_set}"
                logging.info(f"Added replicaSet parameter: replicaSet={replica_set}")
            
            self.client = AsyncIOMotorClient(mongo_uri, **connection_options)
            await self.client.admin.command('ping')
            logging.info("Successfully connected to MongoDB")
            self.is_connected = True
        except Exception as e:
            self.is_connected = False
            logging.error(f"Failed to connect to MongoDB: {str(e)}")
            raise ValueError(f"Failed to connect to MongoDB: {str(e)}")

    async def disconnect(self) -> None:
        """
        Disconnects from the MongoDB server and cleans up resources.
        """
        if self.client and self.is_connected:
            try:
                logging.info("Disconnecting from MongoDB...")
                self.client.close()
                self.is_connected = False
                self.client = None
                self.db = None
            except Exception as e:
                logging.error(f"Error disconnecting from MongoDB: {e}")

    async def get_client(self) -> AsyncIOMotorClient:
        """ Returns the MongoDB client. """
        return self.client

    async def add_new_collection(self, collection_name: str) -> AsyncIOMotorDatabase:
        """ Adds a new collection with the given name and returns it. """
        db = self.client.get_database(collection_name)
        return db

    async def initialize_beanie(self, database: AsyncIOMotorDatabase, document_models: list) -> None:
        """
        Initializes Beanie with the given database and document models.
        """
        await init_beanie(database=database, document_models=document_models)

def is_valid_mongodb_uri(uri: str) -> bool:
    """
    Validates if a string is a properly formatted MongoDB URI.
    
    Args:
        uri (str): The MongoDB URI to validate
        
    Returns:
        bool: True if the URI is valid, False otherwise
    """
    # Basic format check for MongoDB URI
    if not isinstance(uri, str):
        return False
    
    # Check for mongodb:// or mongodb+srv:// protocol
    if not (uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")):
        return False
    
    # For comprehensive validation, we could add more checks like:
    # - Properly formatted host:port
    # - Valid query parameters
    # - etc.
    
    return True

class MongoDbBase:
    """Base class for MongoDB collections."""
    
    _client = None
    _db = None

    async def initialize(self):
        """Initialize the MongoDB connection."""
        if not self._client:
            self._client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
            self._db = self._client.get_database(os.getenv("MONGO_DB"))
            await init_beanie(database=self._db, document_models=[Product, User, Key])

    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self._client:
            await self._client.close()
            self._client = None
            self._db = None

class Coupon(Document):
    code: Indexed(str, unique=True)  # type: ignore
    discountType: str = "percentage"  # "percentage" or "fixed"
    discountValue: float
    active: bool = True
    expiresAt: Optional[datetime] = None
    maxUses: Optional[int] = None
    usageCount: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "coupons"
