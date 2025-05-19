from src.base_exception.base_exception import BaseException
from fastapi import status

class ProductsException(BaseException):
    def __init__(self ,msg:str, path:str ,status_code:int) -> None:
        path = "[ProductsException]:" + path
        super().__init__(msg, path, status_code)


class NotValid(ProductsException):
    def __init__(self ,msg:str, path:str , status_code:int) -> None:
        path = "[NotValid]:" + path
        super().__init__(msg, path, status_code)


class CreateError(NotValid):
    def __init__(self ,msg:str, path:str, status_code:int) -> None:
        path = "[CreateError]:" + path
        super().__init__(msg, path, status_code)


class DeleteError(ProductsException):
    def __init__(self ,msg:str) -> None:
        path = "[DeleteError]:"
        super().__init__(msg, path, status.HTTP_406_NOT_ACCEPTABLE)

class NotFound(NotValid):
    def __init__(self ,msg:str) -> None:
        path = "[NotValid]:"
        super().__init__(msg, path, status.HTTP_404_NOT_FOUND)
