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
            Establishes a connection to the MongoDB server.
        """
        self.client = AsyncIOMotorClient("mongodb://localhost:27017/")

    async def get_client(self) -> AsyncIOMotorClient:
        """ Returns the MongoDB client.

            Returns
            -------
                AsyncIOMotorClient
                    The MongoDB client.
        """
        return self.client
    
    async def add_new_collection(self,collection_name:str) -> AsyncIOMotorDatabase:
        """ Adds a new collection with the given name and returns it.

            Parameters
            ----------
                collection : str
                    The name of the database to add.

            Returns
            -------
                AsyncIOMotorDatabase
                    The new collection.
        """
        db = self.client.get_database(collection_name)
        return db
    
    async def initialize_beanie(self,db,model:any) -> None:
        """ Initializes Beanie ODM with the provided database and document models.

            Parameters
            ----------
                db : AsyncIOMotorDatabase
                    The database to initialize Beanie with.
                model : any
                    The document models to use with Beanie.

        """
        await init_beanie(database= db, document_models=model)

