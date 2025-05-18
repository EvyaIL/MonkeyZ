from motor.motor_asyncio import AsyncIOMotorClient
import os

class ContactCollection:
    def __init__(self, client: AsyncIOMotorClient):
        self.db = client.get_default_database()
        self.collection = self.db["contacts"]

    async def save_contact(self, contact_data: dict):
        result = await self.collection.insert_one(contact_data)
        return str(result.inserted_id)
