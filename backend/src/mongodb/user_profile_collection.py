from typing import Optional, List
from .mongodb import MongoDb
from src.models.user.discord_profile import DiscordProfile, DiscordProfileInDB
from src.models.user.user_profile import UserProfile, UserProfileInDB
import uuid
from datetime import datetime

class UserProfileCollection:
    def __init__(self):
        self.db = MongoDb().get_db()
        self.collection = self.db.user_profiles
        self.discord_collection = self.db.discord_profiles

    async def create_profile(self, user_id: str, profile: UserProfile) -> UserProfileInDB:
        profile_dict = profile.dict()
        profile_dict["user_id"] = user_id
        profile_dict["created_at"] = datetime.now()
        profile_dict["updated_at"] = datetime.now()
        await self.collection.insert_one(profile_dict)
        return UserProfileInDB(**profile_dict)

    async def get_profile(self, user_id: str) -> Optional[UserProfileInDB]:
        profile = await self.collection.find_one({"user_id": user_id})
        if profile:
            return UserProfileInDB(**profile)
        return None

    async def update_profile(self, user_id: str, profile_update: dict) -> Optional[UserProfileInDB]:
        profile_update["updated_at"] = datetime.now()
        result = await self.collection.find_one_and_update(
            {"user_id": user_id},
            {"$set": profile_update},
            return_document=True
        )
        if result:
            return UserProfileInDB(**result)
        return None

    async def add_favorite_item(self, user_id: str, product_id: str) -> bool:
        result = await self.collection.update_one(
            {"user_id": user_id},
            {"$addToSet": {"favorite_items": product_id}}
        )
        return result.modified_count > 0

    async def remove_favorite_item(self, user_id: str, product_id: str) -> bool:
        result = await self.collection.update_one(
            {"user_id": user_id},
            {"$pull": {"favorite_items": product_id}}
        )
        return result.modified_count > 0

    async def add_discord_profile(self, user_id: str, discord_profile: DiscordProfile) -> DiscordProfileInDB:
        profile_dict = discord_profile.dict()
        profile_dict["user_id"] = user_id
        await self.discord_collection.insert_one(profile_dict)
        return DiscordProfileInDB(**profile_dict)

    async def get_discord_profile(self, user_id: str) -> Optional[DiscordProfileInDB]:
        profile = await self.discord_collection.find_one({"user_id": user_id})
        if profile:
            return DiscordProfileInDB(**profile)
        return None

    async def update_discord_verification(self, user_id: str, verified: bool) -> bool:
        result = await self.discord_collection.update_one(
            {"user_id": user_id},
            {"$set": {"verified": verified}}
        )
        return result.modified_count > 0
