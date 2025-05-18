import os
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

    async def connection(self) -> None:
        """
            Establishes a connection to the MongoDB server using the MONGODB_URI environment variable.
        """
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            raise ValueError("MONGODB_URI environment variable is not set.")
        self.client = AsyncIOMotorClient(mongo_uri)

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
