from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserProfile(BaseModel):
    profile_picture: Optional[str] = None
    favorite_items: List[str] = []
    past_orders: List[str] = []
    is_admin: bool = False
    role: int = 1  # 0 for admin, 1 for regular user
    
class UserProfileInDB(UserProfile):
    user_id: str
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
