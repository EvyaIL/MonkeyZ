import contextlib
from fastapi import APIRouter, Depends, HTTPException, Request
from src.models.token.token import LoginResponse, Token, TokenData
from src.deps.deps import UserCollection,KeysCollection , get_user_controller_dependency, UserController
from src.models.user.user import UserRequest, User
from src.models.user.user_response import UserResponse,SelfResponse
from src.lib.token_handler import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from src.lib.token_handler import ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel
import requests
import logging
from datetime import datetime, timedelta
from jose import jwt
from src.lib.email_service import send_password_reset_email, send_otp_email, send_welcome_email # Import all email functions
import os # Added for environment variables
from src.lib.haseing import Hase

# Load from environment variables with defaults
SECRET_KEY = os.getenv("RESET_TOKEN_SECRET_KEY", "your-secret-key-please-change") 
ALGORITHM = "HS256"
RESET_TOKEN_EXPIRE_MINUTES = 30
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000") # Example, adjust as needed

# Helper function to create a password reset token
def create_reset_token(email: str):
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": email, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@contextlib.asynccontextmanager
async def lifespan(router: APIRouter):
   """
   Lifespan context manager for initializing and disconnecting the user controller.

   This context manager handles the lifecycle of the `user_controller` by initializing it
   before yielding control to the FastAPI router and disconnecting it afterward.

   Args:
      router (APIRouter): The FastAPI router to which the lifespan manager is attached.
   """
   user_controller:UserController = get_user_controller_dependency()
   await user_controller.initialize()
   yield
   await user_controller.disconnect()

users_router = APIRouter(prefix=f"/user",tags=["users"], lifespan = lifespan)

@users_router.post("/login", response_model=LoginResponse)
async def login(body:OAuth2PasswordRequestForm = Depends(), user_controller:UserController = Depends(get_user_controller_dependency)):
   login_response:LoginResponse = await user_controller.login(body) 
   return login_response

@users_router.post("")
async def create_user(body:UserRequest,user_controller:UserController = Depends(get_user_controller_dependency)):
   user:User = await user_controller.user_collection.create_user(body) 
   # Send welcome email
   try:
       send_welcome_email(to_email=body.email, username=body.username)
   except Exception as e:
       logging.error(f"Failed to send welcome email: {e}")
       # Continue even if email sending fails
   return str(user.id)

@users_router.get("/all", response_model=list[UserResponse])
async def get_all_users(user_controller:UserController = Depends(get_user_controller_dependency)):
   users = await user_controller.user_collection.get_all_users() 
   return users

@users_router.get("/me" ,response_model=LoginResponse)
async def get_current_user_(user_controller:UserController = Depends(get_user_controller_dependency), current_user:TokenData = Depends(get_current_user)):
   user:UserResponse = await user_controller.get_user_by_token(current_user.username)
   response = LoginResponse(access_token=current_user.access_token, user=user,token_type="Bearer")
   return response

class GoogleAuthRequest(BaseModel):
    credential: str
    skip_otp: bool = True

@users_router.post("/google")
async def google_login(data: GoogleAuthRequest, user_controller: UserController = Depends(get_user_controller_dependency)):
    GOOGLE_CLIENT_ID = "946645411512-tn9qmppcsnp5oqqo88ivkuapou2cmg53.apps.googleusercontent.com"
    logging.info("[Google OAuth] Attempting Google login/signup")
    google_token_info_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={data.credential}"
    resp = requests.get(google_token_info_url)
    if resp.status_code != 200:
        logging.error(f"[Google OAuth] Invalid Google token: {resp.text}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    token_info = resp.json()
    if token_info.get("aud") != GOOGLE_CLIENT_ID:
        logging.error(f"[Google OAuth] Invalid client ID: {token_info.get('aud')}")
        raise HTTPException(status_code=401, detail="Invalid client ID")
    email = token_info.get("email")
    if not email:
        logging.error("[Google OAuth] No email found in Google token.")
        raise HTTPException(status_code=400, detail="No email found in Google token.")
    name = token_info.get("name", email.split("@")[0])
    user = await user_controller.user_collection.get_user_by_email(email)
    user_created = False
    if not user:
        # Create new user with Google info
        # Ensure phone_number is explicitly set to None if not provided by Google
        user_req = UserRequest(username=name, email=email, password="google-oauth", phone_number=None)
        user = await user_controller.user_collection.create_user(user_req)
        user_created = True
        logging.info(f"[Google OAuth] Created new user: {email}")
        
        # Send welcome email for new Google users
        try:
            send_welcome_email(to_email=email, username=name)
        except Exception as e:
            logging.error(f"Failed to send welcome email to Google user: {e}")
            # Continue even if email sending fails
    else:
        # If user exists, ensure their phone_number is not a blocker for Google login.
        # We can decide to either always set it to None, or only if it's currently problematic.
        # For maximum ease of login via Google, we'll ensure it's None if not already set.
        update_needed = False
        if not hasattr(user, 'phone_number') or getattr(user, 'phone_number', None) is None:
            # If phone_number is not present or is None, ensure it's explicitly None.
            # This handles cases where the field might be missing or explicitly null.
            if getattr(user, 'phone_number', 'not_set') is not None: # Avoids unnecessary update if already None
                user.phone_number = None
                update_needed = True
        
        # Ensure password is set for existing users if they originally signed up via other means
        # and are now using Google to log in.
        if not getattr(user, 'password', None) or user.password == "":
            user.password = "google-oauth" # Or some other placeholder
            update_needed = True
            
        if update_needed:
            await user.save()
        logging.info(f"[Google OAuth] Existing user logged in: {email}")
    from src.lib.token_handler import create_access_token
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "user": user, "user_created": user_created}

class PasswordResetRequestPayload(BaseModel):
    email: str

class PasswordResetConfirmPayload(BaseModel):
    token: str
    new_password: str

# Endpoint to request a password reset
@users_router.post("/password-reset/request")
async def request_password_reset(payload: PasswordResetRequestPayload, user_controller: UserController = Depends(get_user_controller_dependency)):
    email = payload.email
    user = await user_controller.user_collection.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_token = create_reset_token(email)
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}" # Use environment variable

    # Use the dedicated function for sending password reset emails
    email_sent = send_password_reset_email(
        to_email=email,
        reset_link=reset_link
    )

    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send reset email")

    return {"message": "Password reset link sent"}

class PasswordResetConfirmPayload(BaseModel):
    token: str
    new_password: str

# Endpoint to reset the password
@users_router.post("/password-reset/confirm")
async def reset_password(payload: PasswordResetConfirmPayload, user_controller: UserController = Depends(get_user_controller_dependency)):
    token = payload.token
    new_password = payload.new_password
    try:
        payload_data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload_data.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await user_controller.user_collection.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password = Hase.bcrypt(new_password)  # Hash the password!
    await user.save()

    return {"message": "Password has been reset successfully"}