from src.base_exception.base_exception import BaseException
from fastapi import status

class ImageException(BaseException):
    def __init__(self ,msg:str, path ,status_code:int) -> None:
        path = "[ImageException]:" + path
        super().__init__(msg, path, status_code)

class NotVaild(ImageException):
    def __init__(self ,msg:str, path:str ,status_code:int) -> None:
        path = "[NotVaild]:" + path
        super().__init__(msg,path, status_code)


class CreateError(NotVaild):
    def __init__(self ,msg:str) -> None:
        path = "[CreateError]:" 
        super().__init__(msg, path, status.HTTP_400_BAD_REQUEST)


class NotFoundError(ImageException):
    def __init__(self ,msg:str) -> None:
        path = "[NotFoundError]:" 
        super().__init__(msg, path, status.HTTP_404_NOT_FOUND)
