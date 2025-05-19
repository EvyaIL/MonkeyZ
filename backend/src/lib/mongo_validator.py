"""
MongoDB connection validator module.
Provides utility functions to validate and test MongoDB connection strings.
"""
import re
import logging
from motor.motor_asyncio import AsyncIOMotorClient

def is_valid_mongodb_uri(uri: str) -> bool:
    """
    Validates if a string is a syntactically valid MongoDB connection URI.
    
    Args:
        uri (str): The MongoDB connection URI to validate.
        
    Returns:
        bool: True if the URI is valid, False otherwise.
    """
    if not uri:
        return False
        
    # Basic pattern for MongoDB URI validation
    pattern = r'^mongodb(?:\+srv)?:\/\/(?:(?:[^:]*):(?:[^@]*)@)?(?:[^:@\/]+)(?::(?:\d+))?(?:\/(?:[^?]*))?(?:\?(?:.*))$'
    return bool(re.match(pattern, uri))

async def test_mongodb_connection(uri: str) -> dict:
    """
    Tests a MongoDB connection URI by attempting to connect and ping the server.
    
    Args:
        uri (str): The MongoDB connection URI to test.
        
    Returns:
        dict: A dictionary with the connection test results.
    """
    result = {
        "success": False,
        "message": "",
        "details": None
    }
    
    if not is_valid_mongodb_uri(uri):
        result["message"] = "Invalid MongoDB URI format"
        return result
    
    try:
        # Try to connect with a short timeout
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        # Ping to verify connection
        await client.admin.command('ping')
        
        # Get server info to verify connection details
        server_info = await client.admin.command('serverStatus')
        
        result["success"] = True
        result["message"] = "Connection successful"
        result["details"] = {
            "version": server_info.get("version", "Unknown"),
            "uptime": server_info.get("uptime", 0),
            "connections": server_info.get("connections", {}).get("current", 0)
        }
        
        # Close the connection
        client.close()
    except Exception as e:
        result["message"] = f"Connection failed: {str(e)}"
        logging.error(f"MongoDB connection test failed: {str(e)}")
    
    return result
