from fastapi import UploadFile
from .mongodb import MongoDb
from src.models.images.image import Image,ImageRequest
from src.models.images.image_exception import  CreateError, NotFoundError
from src.singleton.singleton import Singleton
from beanie import PydanticObjectId

class ImageCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Image database, implemented as a Singleton.
    This class provides methods to create, retrieve, and delete images stored in the database.
    """

    async def initialize(self) -> None:
        """
            Initializes the database and sets up the Beanie model for the Image collection.
            
            This method connects to the database named "DeepMatch" and initializes the Beanie ORM 
            with the Image model to interact with the collection.
        """
        database_name = "DeepMatch"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Image])

    async def create_image(self,image_request:ImageRequest) -> PydanticObjectId:
        """Creates an image document from the uploaded file and saves it to the database.
            
            Args:
                file (UploadFile): The uploaded file to be saved as an image.
                file_name (str): The name of the file to be used as the image's filename.
            
            Returns:
                PydanticObjectId: The unique identifier (ID) of the created image document.
        """
        try:
            image = Image(data=image_request.data, filename=image_request.filename)
            await image.save()
            return image.id
        except Exception as e :
            raise CreateError(e)
            
    async def delete_image(self, id:PydanticObjectId):
        """ Deletes an image document from the database by its ID.
            
            Args:
                id (PydanticObjectId): The ID of the image to be deleted.
            
            This method fetches the image document using the provided ID and deletes it from the database.
        """
        image = await self.get_image(id)
        if image:
            await image.delete()
        
    async def get_image(self, id:PydanticObjectId):
        """ Retrieves an image document from the database by its ID.
        
            Args:
                id (PydanticObjectId): The ID of the image to be retrieved.
        
            Returns:
                Optional[Image]: The image document if found, or None if no image with the given ID exists.
        """
        image =await Image.get(id)
        return image
