import os
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClient
from beanie import init_beanie
from typing import Optional

from ..lib.database_manager import db_manager, get_database, get_client

class MongoDb:
    """
    Optimized MongoDB connection class using the enhanced database manager.
    """

    def __init__(self) -> None:
        """
        Initializes the MongoDb class with the global database manager.
        """
        self.manager = db_manager
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.is_connected: bool = False

    async def connection(self) -> None:
        """
        Establishes a connection to the MongoDB server using the optimized connection manager.
        Falls back to direct connection if optimized manager fails.
        """
        if self.is_connected and self.client is not None and self.db is not None:
            return

        try:
            # Try the optimized database manager first
            if not self.manager.is_connected:
                success = await self.manager.connect(max_retries=2, retry_delay=1.0)
                if not success:
                    raise ConnectionError("Optimized manager connection failed")
            
            # Get connections from the manager
            self.client = await get_client()
            self.db = await get_database()
            self.is_connected = True
            logging.debug("Database connection established successfully via optimized manager")
            return
                
        except Exception as e:
            logging.warning(f"Optimized connection failed: {e}, attempting direct connection...")
        
        # Fallback to direct connection using MONGODB_URI
        try:
            mongodb_uri = os.getenv("MONGODB_URI")
            if not mongodb_uri:
                # If no MONGODB_URI, try to build one from individual variables
                host = os.getenv("MONGO_HOST", "localhost")
                port = os.getenv("MONGO_PORT", "27017")
                database = os.getenv("MONGO_DATABASE", "monkeyz")
                mongodb_uri = f"mongodb://{host}:{port}/{database}"
                
            logging.info(f"Attempting direct MongoDB connection to: {mongodb_uri[:50]}...")
            
            from motor.motor_asyncio import AsyncIOMotorClient
            
            # Create client with basic connection options
            self.client = AsyncIOMotorClient(
                mongodb_uri,
                serverSelectionTimeoutMS=15000,
                connectTimeoutMS=30000,
                socketTimeoutMS=45000,
                retryWrites=True,
                retryReads=True
            )
            
            # Test the connection
            await self.client.admin.command('ping')
            
            # Get database
            if "/" in mongodb_uri and "?" in mongodb_uri:
                db_name = mongodb_uri.split("/")[-1].split("?")[0]
            elif "/" in mongodb_uri:
                db_name = mongodb_uri.split("/")[-1]
            else:
                db_name = os.getenv("MONGO_DATABASE", "monkeyz")
                
            self.db = self.client[db_name]
            await self.db.command('ping')
            
            self.is_connected = True
            logging.info("Direct database connection established successfully")
            
        except Exception as e:
            logging.error(f"Failed to establish any database connection: {e}")
            self.is_connected = False
            raise ConnectionError(f"All database connection methods failed: {e}")

    async def get_db(self) -> AsyncIOMotorDatabase:
        """
        Returns the database instance, establishing connection if needed.
        """
        if not self.is_connected or self.db is None:
            await self.connection()
        return self.db

    async def get_client(self) -> AsyncIOMotorClient:
        """
        Returns the client instance, establishing connection if needed.
        """
        if not self.is_connected or self.client is None:
            await self.connection()
        return self.client

    async def close(self) -> None:
        """
        Closes the database connection.
        """
        try:
            # Only disconnect if we haven't already
            if self.is_connected:
                self.is_connected = False
                self.client = None
                self.db = None
                logging.debug("Collection connection closed")
        except Exception as e:
            logging.error(f"Error closing database connection: {e}")

    async def disconnect(self) -> None:
        """
        Alias for close() method for backward compatibility.
        """
        await self.close()

    async def initialize_beanie(self, database: AsyncIOMotorDatabase, document_models: list) -> None:
        """
        Initializes Beanie with the given database and document models.
        """
        try:
            await init_beanie(database=database, document_models=document_models)
            model_names = [model.__name__ for model in document_models]
            logging.debug(f"Beanie initialized for {', '.join(model_names)} in database: {database.name}")
        except Exception as e:
            logging.error(f"Failed to initialize Beanie: {e}")
            raise e

def is_valid_mongodb_uri(uri: str) -> bool:
    """
    Validates if a string is a properly formatted MongoDB URI.
    
    Args:
        uri (str): The MongoDB URI to validate
        
    Returns:
        bool: True if the URI is valid, False otherwise
    """
    if not isinstance(uri, str):
        return False
    
    # Check for mongodb:// or mongodb+srv:// protocol
    return uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")

class MongoDbBase:
    """Base class for MongoDB collections with optimized connection handling."""
    
    _client = None
    _db = None
    

