from fastapi import Depends, HTTPException, status
from src.models.user.user import User, Role
from src.lib.token_handler import get_current_user # Assuming this returns a user model or token data
from src.mongodb.users_collection import UserCollection # To fetch user details
from src.deps.deps import get_user_collection_dependency # Dependency for UserCollection

async def get_current_admin_user(
    current_user_token: User = Depends(get_current_user), # Or the type returned by get_current_user
    user_collection: UserCollection = Depends(get_user_collection_dependency)
) -> User:
    """
    Dependency to get the current user and verify if they are an admin.
    Raises HTTPException if the user is not found or not an admin.
    """
    # Assuming get_current_user returns a User model with an 'id' or 'username'
    # If it returns token data, you might need to fetch the user by username/id from token
    
    # Let's assume current_user_token directly gives us a User object or enough info to fetch one.
    # If get_current_user returns a lightweight token payload, you'd first extract username/id
    # For example, if it's a username:
    # user = await user_collection.get_user_by_username(current_user_token.username)
    
    # If get_current_user already returns a full User object with role:
    user = current_user_token 

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch the latest user data from the database to ensure role is current
    # This is important if roles can change and the token might hold outdated info.
    # Assuming user object from token has an 'id' attribute.
    db_user = await user_collection.get_user_by_id(user.id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found in database",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if db_user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return db_user
