# Admin router for MonkeyZ e-commerce 
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from typing import List, Optional
from ..models.product.product import Product, ProductInDB, ProductTag
from ..mongodb.products_collection_extended import ProductsCollection
from ..mongodb.tag_collection import TagCollection
from ..lib.token_handler import get_current_user
import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])
product_collection = ProductsCollection()
tag_collection = TagCollection()

# Initialize S3 client for product images
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY")
)
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Helper function to check admin permission
async def verify_admin(current_user: dict = Depends(get_current_user)):
    # Check if user has admin role
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="Administrator permission required"
        )
    return current_user

@router.get("/products", dependencies=[Depends(verify_admin)])
async def get_all_products():
    """Get all products with full details for admin view"""
    products = await product_collection.get_all_products()
    
    # For each product, fetch complete tag information
    for product in products:
        if product.tags:
            tags = []
            for tag_id in product.tags:
                tag = await tag_collection.get_tag_by_id(tag_id)
                if tag:
                    tags.append(tag)
            product.tags = tags
    
    return products

@router.post("/products", dependencies=[Depends(verify_admin)])
async def create_product(product: Product):
    """Create a new product"""
    product_id = str(uuid.uuid4())
    product_dict = product.dict()
    product_dict["id"] = product_id
    product_dict["created_at"] = datetime.now().isoformat()
    product_dict["updated_at"] = datetime.now().isoformat()
    
    await product_collection.create_product(product_dict)
    return {"id": product_id, "message": "Product created successfully"}

@router.put("/products/{product_id}", dependencies=[Depends(verify_admin)])
async def update_product(product_id: str, product: Product):
    """Update an existing product"""
    product_dict = product.dict()
    product_dict["updated_at"] = datetime.now().isoformat()
    
    # Check if product exists
    existing_product = await product_collection.get_product_by_id(product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    success = await product_collection.update_product(product_id, product_dict)
    if success:
        return {"message": "Product updated successfully"}
    raise HTTPException(status_code=400, detail="Failed to update product")

@router.delete("/products/{product_id}", dependencies=[Depends(verify_admin)])
async def delete_product(product_id: str):
    """Delete a product"""
    # Check if product exists
    existing_product = await product_collection.get_product_by_id(product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    success = await product_collection.delete_product(product_id)
    if success:
        return {"message": "Product deleted successfully"}
    raise HTTPException(status_code=400, detail="Failed to delete product")

@router.post("/products/upload-image", dependencies=[Depends(verify_admin)])
async def upload_product_image(file: UploadFile = File(...)):
    """Upload a product image to S3"""
    try:
        # Upload to S3
        file_extension = file.filename.split('.')[-1]
        key = f"product-images/{uuid.uuid4()}.{file_extension}"
        s3_client.upload_fileobj(file.file, BUCKET_NAME, key)
        
        # Return URL to the uploaded image
        image_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}"
        return {"url": image_url}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/products/{product_id}/keys", dependencies=[Depends(verify_admin)])
async def add_product_keys(product_id: str, keys: List[str] = Body(..., embed=True)):
    """Add product keys for digital products"""
    # Check if product exists
    existing_product = await product_collection.get_product_by_id(product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Add keys (implementation depends on your key storage mechanism)
    success = await product_collection.add_product_keys(product_id, keys)
    if success:
        return {"message": f"{len(keys)} keys added successfully"}
    raise HTTPException(status_code=400, detail="Failed to add keys")

@router.get("/products/{product_id}/stock", dependencies=[Depends(verify_admin)])
async def get_product_stock(product_id: str):
    """Get stock information for a product"""
    # Check if product exists
    existing_product = await product_collection.get_product_by_id(product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "stock_count": existing_product.stock_count,
        "product_id": product_id,
        "product_name": existing_product.name
    }

@router.put("/products/{product_id}/stock", dependencies=[Depends(verify_admin)])
async def update_product_stock(product_id: str, stock_count: int = Body(..., embed=True)):
    """Update stock count for a product"""
    # Check if product exists
    existing_product = await product_collection.get_product_by_id(product_id)
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    success = await product_collection.update_product(product_id, {"stock_count": stock_count})
    if success:
        return {"message": "Stock updated successfully"}
    raise HTTPException(status_code=400, detail="Failed to update stock")
