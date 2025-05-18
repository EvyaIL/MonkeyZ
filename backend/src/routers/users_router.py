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

GOOGLE_CLIENT_ID = "946645411512-tn9qmppcsnp5oqqo88ivkuapou2cmg53.apps.googleusercontent.com"

class GoogleAuthRequest(BaseModel):
    credential: str
    skip_otp: bool = True

@users_router.post("/google")
async def google_login(data: GoogleAuthRequest, user_controller: UserController = Depends(get_user_controller_dependency)):
    # 1. Verify Google token
    google_token_info_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={data.credential}"
    resp = requests.get(google_token_info_url)
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")
    token_info = resp.json()
    if token_info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Invalid client ID")

    email = token_info.get("email")
    name = token_info.get("name", email.split("@")[0])

    # 2. Find or create user in your DB
    user = await user_controller.user_collection.get_user_by_email(email)
    if not user:
        # You may want to set a random password or mark as Google user
        user_req = UserRequest(username=name, email=email, password="google-oauth", phone_number="", role="user")
        user = await user_controller.user_collection.create_user(user_req)
    # 3. Generate JWT token
    from src.lib.token_handler import create_access_token
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "user": user}