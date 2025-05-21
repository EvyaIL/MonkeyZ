from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BlogComment(BaseModel):
    user_id: str
    comment: str
    likes: List[str] = []  # List of user IDs who liked this comment
    
class BlogCommentInDB(BlogComment):
    comment_id: str
    post_id: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
