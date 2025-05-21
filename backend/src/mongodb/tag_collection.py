from typing import List, Optional
from .mongodb import MongoDB
from ...models.product.tag import ProductTag, ProductTagInDB
from datetime import datetime
import uuid

class TagCollection:
    def __init__(self):
        self.db = MongoDB().get_db()
        self.collection = self.db.product_tags

    async def create_tag(self, tag: ProductTag) -> ProductTagInDB:
        tag_dict = tag.dict()
        tag_dict["id"] = str(uuid.uuid4())
        tag_dict["created_at"] = datetime.now()
        tag_dict["updated_at"] = datetime.now()
        await self.collection.insert_one(tag_dict)
        return ProductTagInDB(**tag_dict)

    async def get_all_tags(self) -> List[ProductTagInDB]:
        tags = await self.collection.find().to_list(None)
        return [ProductTagInDB(**tag) for tag in tags]

    async def get_tag_by_id(self, tag_id: str) -> Optional[ProductTagInDB]:
        tag = await self.collection.find_one({"id": tag_id})
        if tag:
            return ProductTagInDB(**tag)
        return None

    async def update_tag(self, tag_id: str, tag: ProductTag) -> Optional[ProductTagInDB]:
        tag_dict = tag.dict()
        tag_dict["updated_at"] = datetime.now()
        result = await self.collection.find_one_and_update(
            {"id": tag_id},
            {"$set": tag_dict},
            return_document=True
        )
        if result:
            return ProductTagInDB(**result)
        return None

    async def delete_tag(self, tag_id: str) -> bool:
        result = await self.collection.delete_one({"id": tag_id})
        return result.deleted_count > 0

    async def get_tags_by_ids(self, tag_ids: List[str]) -> List[ProductTagInDB]:
        tags = await self.collection.find({"id": {"$in": tag_ids}}).to_list(None)
        return [ProductTagInDB(**tag) for tag in tags]
