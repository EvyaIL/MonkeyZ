import os
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorClient
from beanie import init_beanie

class MongoDb:
    """
        A class for interacting with a MongoDB database
    """

    def __init__(self) -> None:
        """
            Initializes the MongoDb class with no client initially connected.
        """
        self.client = None
        self.is_connected = False

    async def connection(self) -> None:
        """
            Establishes a connection to the MongoDB server using the MONGODB_URI environment variable.
        """
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            logging.error("MONGODB_URI environment variable is not set.")
            raise ValueError("MONGODB_URI environment variable is not set.")
        
        # For DigitalOcean VPC, ensure the URI uses the private hostname and correct credentials
        if not is_valid_mongodb_uri(mongo_uri):
            logging.error("MONGODB_URI has an invalid format.")
            raise ValueError("MONGODB_URI has an invalid format. Please check your connection string.")
        
        try:
            logging.info(f"Connecting to MongoDB at: {mongo_uri}")
            self.client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=15000, connectTimeoutMS=30000, socketTimeoutMS=45000)
            await self.client.admin.command('ping')
            logging.info("Successfully connected to MongoDB")
            self.is_connected = True
        except Exception as e:
            self.is_connected = False
            logging.error(f"Failed to connect to MongoDB: {str(e)}")
            raise ValueError(f"Failed to connect to MongoDB: {str(e)}")

    async def get_client(self) -> AsyncIOMotorClient:
        """ Returns the MongoDB client. """
        return self.client

    async def add_new_collection(self, collection_name: str) -> AsyncIOMotorDatabase:
        """ Adds a new collection with the given name and returns it. """
        db = self.client.get_database(collection_name)
        return db

    async def initialize_beanie(self, db, model: any) -> None:
        """ Initializes Beanie ODM with the provided database and document models. """
        await init_beanie(database=db, document_models=model)

def is_valid_mongodb_uri(uri: str) -> bool:
    """Basic check for MongoDB URI format."""
    return uri.startswith("mongodb://") or uri.startswith("mongodb+srv://")
