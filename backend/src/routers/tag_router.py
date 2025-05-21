from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.product.tag import ProductTag, ProductTagInDB
from ..mongodb.tag_collection import TagCollection
from ..lib.token_handler import get_current_user

router = APIRouter()
tag_collection = TagCollection()

@router.post("/admin/tags", response_model=ProductTagInDB)
async def create_tag(tag: ProductTag, current_user: dict = Depends(get_current_user)):
    # Check if user is admin
    if current_user.get("role", 1) != 0:  # 0 is admin role
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await tag_collection.create_tag(tag)
    return result

@router.get("/admin/tags", response_model=List[ProductTagInDB])
async def get_all_tags(current_user: dict = Depends(get_current_user)):
    if current_user.get("role", 1) != 0:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tags = await tag_collection.get_all_tags()
    return tags

@router.get("/admin/tags/{tag_id}", response_model=ProductTagInDB)
async def get_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role", 1) != 0:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    tag = await tag_collection.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

@router.put("/admin/tags/{tag_id}", response_model=ProductTagInDB)
async def update_tag(tag_id: str, tag: ProductTag, current_user: dict = Depends(get_current_user)):
    if current_user.get("role", 1) != 0:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await tag_collection.update_tag(tag_id, tag)
    if not result:
        raise HTTPException(status_code=404, detail="Tag not found")
    return result

@router.delete("/admin/tags/{tag_id}")
async def delete_tag(tag_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role", 1) != 0:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    success = await tag_collection.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted successfully"}
