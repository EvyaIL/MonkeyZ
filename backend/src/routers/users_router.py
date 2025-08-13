import contextlib
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from src.models.token.token import LoginResponse, Token, TokenData
from src.deps.deps import UserCollection,KeysCollection , get_user_controller_dependency, UserController
from src.models.user.user import UserRequest, User
from src.models.user.user_response import UserResponse,SelfResponse
from src.lib.token_handler import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from src.lib.token_handler import ACCESS_TOKEN_EXPIRE_MINUTES
from pydantic import BaseModel

logger = logging.getLogger(__name__)
import requests
import logging
from datetime import datetime, timedelta
from jose import jwt
from src.lib.email_service import send_password_reset_email, send_otp_email, send_welcome_email # Import all email functions
import os # Added for environment variables
from src.lib.haseing import Hase
from src.models.order import Order # Added import
from src.models.token.token import TokenData
from src.mongodb.mongodb import MongoDb
from src.deps.deps import get_order_collection_dependency, OrdersCollection # Adjusted import
from typing import List, Optional # Add List to imports
from src.middleware.rate_limiter import rate_limiter

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
async def login(
    request: Request,
    body: OAuth2PasswordRequestForm = Depends(), 
    user_controller: UserController = Depends(get_user_controller_dependency)
):
    client_ip = rate_limiter._get_client_ip(request)
    
    try:
        login_response: LoginResponse = await user_controller.login(body)
        # Record successful login to clear failed attempts
        rate_limiter.record_successful_login(client_ip)
        return login_response
    except HTTPException as e:
        # Record failed login attempt
        if e.status_code == 401:  # Unauthorized - failed credentials
            is_banned = rate_limiter.record_failed_login(client_ip)
            if is_banned:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many failed login attempts. Your IP has been temporarily banned."
                )
        raise e

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

# Removed duplicate /me endpoint - using the one below with SelfResponse

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

# ADDED - Initialize MongoDB instance
mongo_db = MongoDb()

@users_router.get("/orders", response_model=list[Order])
async def get_user_orders(
    current_user_token: TokenData = Depends(get_current_user), 
    order_collection: OrdersCollection = Depends(get_order_collection_dependency) # Changed to OrdersCollection
) -> List[Order]:
    try:
        user_id = current_user_token.username # Corrected line
        if not user_id:
            raise HTTPException(status_code=403, detail="User ID not found in token")
        
        orders = await order_collection.get_orders_by_user_id(user_id)
        if not orders:
            return []
        return orders
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        # Log the exception for debugging
        logger.error("Error in get_user_orders: %s", e)
        # Consider what to return or raise. For now, re-raising a generic 500.
        raise HTTPException(status_code=500, detail="An unexpected error occurred while fetching user orders.")

@users_router.get("/me", response_model=SelfResponse)
async def get_current_user_details(
    user_controller: UserController = Depends(get_user_controller_dependency),
    current_user: TokenData = Depends(get_current_user)
):
    user = await user_controller.get_user_by_token(current_user.username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Exclude sensitive fields like password
    user_dict = user.dict(exclude={"password", "email_verified", "is_superuser"})
    return SelfResponse(**user_dict)

@users_router.get("/me/orders", response_model=List[Order])
async def get_my_orders(
    current_user: TokenData = Depends(get_current_user),
    orders_collection: OrdersCollection = Depends(get_order_collection_dependency),
    user_controller: UserController = Depends(get_user_controller_dependency) # Added UserController dependency
):
    # Fetch the full user object to get the email
    user = await user_controller.user_collection.get_user_by_username(current_user.username)
    if not user or not user.email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found or email is missing for the authenticated user."
        )

    user_email = user.email # Use the email from the fetched user object
    
    if not user_email: # Should be redundant due to the check above, but good for safety
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email is missing for the user.")
    
    orders = await orders_collection.get_orders_by_email(user_email)
    if not orders:
        return [] 
    return orders

# OTP functionality
import random
import string

class OTPRequestPayload(BaseModel):
    email: str

class OTPVerifyPayload(BaseModel):
    email: str
    otp: str

# Simple in-memory OTP storage (in production, use Redis or database)
otp_storage = {}

def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

@users_router.post("/otp/request")
async def request_otp(payload: OTPRequestPayload, user_controller: UserController = Depends(get_user_controller_dependency)):
    """Request an OTP for email verification"""
    email = payload.email
    
    # Check if user exists
    user = await user_controller.user_collection.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate OTP
    otp = generate_otp()
    
    # Store OTP (expires in 10 minutes)
    from datetime import datetime, timedelta
    otp_storage[email] = {
        "otp": otp,
        "expires": datetime.utcnow() + timedelta(minutes=10)
    }
    
    # Send OTP email
    email_sent = send_otp_email(
        to_email=email,
        otp=otp
    )
    
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    
    return {"message": "OTP sent to your email"}

@users_router.post("/otp/verify")
async def verify_otp(payload: OTPVerifyPayload):
    """Verify an OTP"""
    email = payload.email
    provided_otp = payload.otp
    
    # Check if OTP exists
    if email not in otp_storage:
        raise HTTPException(status_code=400, detail="No OTP found for this email")
    
    stored_data = otp_storage[email]
    
    # Check if OTP expired
    from datetime import datetime
    if datetime.utcnow() > stored_data["expires"]:
        del otp_storage[email]  # Clean up expired OTP
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Verify OTP
    if provided_otp != stored_data["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # OTP verified successfully, clean up
    del otp_storage[email]
    
    return {"message": "OTP verified successfully"}