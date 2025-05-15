from abc import ABC

class ControllerInterface(ABC):
    """Abstract base class for all controllers, enforcing initialization and disconnection methods."""

    async def initialize(self):
        """Initializes the controller."""
        raise NotImplementedError

    async def disconnect(self):
        """Disconnects the controller."""
        raise NotImplementedError
