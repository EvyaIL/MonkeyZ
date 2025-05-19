from typing import Any


class Singleton(type):
    """
    A Singleton metaclass to ensure a class has only one instance.
    """
    _instances = {}

    def __call__(cls, *args: Any, **kwargs: Any) -> Any:
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]

