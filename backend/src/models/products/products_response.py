from beanie import Indexed,PydanticObjectId
from pydantic import BaseModel
from typing import Optional

class ProductResponse(BaseModel):
    id:PydanticObjectId
    name: Indexed(str,unique=True) # type: ignore 
    description:str
    price:int
    active:bool
    stock:int
    best_seller:bool
    image:Optional[PydanticObjectId] = None



    

