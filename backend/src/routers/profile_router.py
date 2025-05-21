from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional
from ..models.user.user_profile import UserProfile
from ..models.user.discord_profile import DiscordProfile
from ..mongodb.user_profile_collection import UserProfileCollection
from ..lib.token_handler import get_current_user
import discord
import boto3
from botocore.exceptions import ClientError
import os
from datetime import datetime

router = APIRouter()
user_collection = UserProfileCollection()

# Initialize Discord client
DISCORD_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
discord_client = discord.Client(intents=discord.Intents.default())

# Initialize S3 client for profile pictures
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY")
)
BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

@router.post("/profile/discord/connect")
async def connect_discord(discord_profile: DiscordProfile, current_user: dict = Depends(get_current_user)):
    try:
        # Save Discord profile
        await user_collection.add_discord_profile(current_user["id"], discord_profile)
        return {"message": "Discord profile connected successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/upload-picture")
async def upload_profile_picture(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        # Upload to S3
        file_extension = file.filename.split('.')[-1]
        key = f"profile-pictures/{current_user['id']}/profile.{file_extension}"
        s3_client.upload_fileobj(file.file, BUCKET_NAME, key)
        
        # Update user profile with picture URL
        picture_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}"
        await user_collection.update_profile(current_user["id"], {"profile_picture": picture_url})
        
        return {"url": picture_url}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/favorites/{product_id}")
async def toggle_favorite(product_id: str, current_user: dict = Depends(get_current_user)):
    user_profile = await user_collection.get_profile(current_user["id"])
    
    if product_id in user_profile.favorite_items:
        success = await user_collection.remove_favorite_item(current_user["id"], product_id)
        action = "removed from"
    else:
        success = await user_collection.add_favorite_item(current_user["id"], product_id)
        action = "added to"
    
    if success:
        return {"message": f"Product {action} favorites successfully"}
    raise HTTPException(status_code=400, detail="Failed to update favorites")

@router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    profile = await user_collection.get_profile(current_user["id"])
    if not profile:
        # Create new profile if it doesn't exist
        profile = await user_collection.create_profile(current_user["id"], UserProfile())
    return profile

# Discord verification webhook endpoint
@router.post("/discord/webhook")
async def discord_webhook(payload: dict):
    try:
        user_id = payload.get("user_id")
        verified = payload.get("verified", False)
        
        if user_id:
            await user_collection.update_discord_verification(user_id, verified)
            return {"message": "Discord verification status updated"}
        
        raise HTTPException(status_code=400, detail="Invalid payload")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
