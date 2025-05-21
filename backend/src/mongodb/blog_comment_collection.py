from typing import Optional, List
from ..mongodb import MongoDB
from ...models.blog.comment import BlogComment, BlogCommentInDB
import uuid
from datetime import datetime

class BlogCommentCollection:
    def __init__(self):
        self.db = MongoDB().get_db()
        self.collection = self.db.blog_comments

    async def create_comment(self, post_id: str, comment: BlogComment) -> BlogCommentInDB:
        comment_dict = comment.dict()
        comment_dict["comment_id"] = str(uuid.uuid4())
        comment_dict["post_id"] = post_id
        comment_dict["created_at"] = datetime.now()
        comment_dict["updated_at"] = datetime.now()
        await self.collection.insert_one(comment_dict)
        return BlogCommentInDB(**comment_dict)

    async def get_post_comments(self, post_id: str) -> List[BlogCommentInDB]:
        cursor = self.collection.find({"post_id": post_id})
        comments = await cursor.to_list(length=None)
        return [BlogCommentInDB(**comment) for comment in comments]

    async def add_like(self, comment_id: str, user_id: str) -> bool:
        result = await self.collection.update_one(
            {"comment_id": comment_id},
            {"$addToSet": {"likes": user_id}}
        )
        return result.modified_count > 0

    async def remove_like(self, comment_id: str, user_id: str) -> bool:
        result = await self.collection.update_one(
            {"comment_id": comment_id},
            {"$pull": {"likes": user_id}}
        )
        return result.modified_count > 0
