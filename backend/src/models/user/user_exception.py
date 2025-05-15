from src.base_exception.base_exception import BaseException
from fastapi import status

class UserException(BaseException):
    def __init__(self ,msg:str, path ,status_code:int) -> None:
        path = "[UserException]:" + path
        super().__init__(msg, path, status_code)

class NotVaild(UserException):
    def __init__(self ,msg:str, path:str,status_code:int) -> None:
        path = "[NotVaild]:" + path
        super().__init__(msg,path, status_code)


class CreateError(NotVaild):
    def __init__(self ,msg:str) -> None:
        path = "[CreateError]:" 
        super().__init__(msg, path, status.HTTP_400_BAD_REQUEST)


class LoginError(NotVaild):
    def __init__(self ,msg:str) -> None:
        path = "[LogginErorr]:" 
        super().__init__(msg, path, status.HTTP_404_NOT_FOUND)


