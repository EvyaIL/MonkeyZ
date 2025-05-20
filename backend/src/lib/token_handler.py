from typing import Optional
from datetime import datetime,timedelta
from jose import jwt,JWTError
from dotenv import load_dotenv
import os



from src.models.token.token_exception import NotVaildTokenException
from src.models.token.token import TokenData
load_dotenv()

# Get environment variables and remove any quotes that might be present
SECRET_KEY = str(os.getenv('SECRET_KEY', 'default_secret_key')).strip('"\'')
ALGORITHM = str(os.getenv('ALGORITHM', 'HS256')).strip('"\'')
try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))
except (TypeError, ValueError):
    ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data:dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp":expire})
    encoded_jwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token:str) -> TokenData:
    try:
        paylaod =jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        username :str = paylaod.get("sub")
        if username is None:
            raise NotVaildTokenException("Could not validate credentials")
        token_data= TokenData(username=username, access_token=token)
        return token_data
    except JWTError:
        raise NotVaildTokenException("Could not validate credentials")




from fastapi import  Depends
from fastapi.security import OAuth2PasswordBearer


oauth2_scheme = OAuth2PasswordBearer(tokenUrl ="user/login")
    
def get_current_user(data:str = Depends(oauth2_scheme)):
    return verify_token(data)
