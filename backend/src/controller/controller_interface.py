from abc import ABC

class ControllerInterface(ABC):
    """Base interface for all controllers."""

    async def connect(self):
        """Connect to database or other resources."""
        pass

    async def disconnect(self):
        """Disconnect from database or other resources."""
        if hasattr(self, 'client') and self.client:
            await self.client.close()
        # Assuming MongoDB client stored in self.client
