class BaseException(Exception):
    def __init__(self ,msg:str, path:str ,status_code:int) -> None:
        self.msg = msg
        self.path = "[BaseException]:" + path
        self.status_code =status_code

    def __str__(self) -> str:
        return self.msg