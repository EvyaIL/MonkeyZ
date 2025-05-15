from src.base_exception.base_exception import BaseException
from fastapi import status

class keysException(BaseException):
    def __init__(self ,msg:str, path:str ,status_code:int) -> None:
        path = "[keysException]:" + path
        super().__init__(msg, path, status_code)


class NotValid(keysException):
    def __init__(self ,msg:str, status_code:int) -> None:
        path = "[NotVaild]:"
        super().__init__(msg, path, status_code)

class CreateErorr(NotValid):
    def __init__(self ,msg:str, status_code:int) -> None:
        path = "[CreateErorr]:"
        super().__init__(msg,path,status_code)

class UpdateError(NotValid):
    def __init__(self ,msg:str) -> None:
        path = "[CreateErorr]:"
        super().__init__(msg,path,status.HTTP_406_NOT_ACCEPTABLE)

class DeleteError(NotValid):
    def __init__(self ,msg:str) -> None:
        path = "[DeleteError]:"
        super().__init__(msg, path, status.HTTP_406_NOT_ACCEPTABLE)

class GetError(NotValid):
    def __init__(self ,msg:str) -> None:
        path = "[GetError]:"
        super().__init__(msg, path, status.HTTP_409_CONFLICT)
