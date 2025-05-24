from src.base_exception.base_exception import BaseException
from fastapi import status
class TokenException(BaseException):
    def __init__(self ,msg:str, status_code:int) -> None:
        path = "[TokenException]:"
        self.msg = path + msg
        super().__init__(msg=msg, path=path, status_code=status_code)



class NotVaildTokenException(TokenException):
    def __init__(self ,msg:str) -> None:
        self.msg = "[NotVaildTokenException]:" + msg
        super().__init__(msg=msg, status_code=status.HTTP_401_UNAUTHORIZED)

