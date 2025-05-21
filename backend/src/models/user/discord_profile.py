from pydantic import BaseModel
from typing import Optional

class DiscordProfile(BaseModel):
    discord_id: str
    username: str
    avatar: Optional[str] = None
    verified: bool = False
    
class DiscordProfileInDB(DiscordProfile):
    user_id: str
