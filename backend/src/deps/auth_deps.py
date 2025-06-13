from fastapi import Depends, HTTPException, status
from src.models.user.user import User, Role
from src.lib.token_handler import get_current_user # Assuming this returns a user model or token data
from src.mongodb.users_collection import UserCollection # To fetch user details
from src.deps.deps import get_user_collection_dependency # Dependency for UserCollection
from src.models.token.token import TokenData # Import TokenData

async def get_current_admin_user(
    current_user_token: TokenData = Depends(get_current_user), # Changed type to TokenData
    user_collection: UserCollection = Depends(get_user_collection_dependency)
) -> User:
    """
    Dependency to get the current user and verify if they are an admin.
    Raises HTTPException if the user is not found or not an admin.
    """
    if not current_user_token.username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: username missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch the user by username from the token
    db_user = await user_collection.get_user_by_username(current_user_token.username)
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if the user's role is manager (admin)
    if db_user.role != Role.manager: # Changed Role.ADMIN to Role.manager
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return db_user
