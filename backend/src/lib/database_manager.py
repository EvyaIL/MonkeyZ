"""
Optimized MongoDB connection management with connection pooling,
retry logic, and comprehensive error handling.
"""

import asyncio
import os
import time
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import (
    ConnectionFailure, ServerSelectionTimeoutError, 
    NetworkTimeout, OperationFailure, InvalidURI
)
import logging
from datetime import datetime, timezone

from ..lib.logging_config import get_logger, error_tracker

logger = get_logger(__name__)

class DatabaseConnectionManager:
    """Enhanced database connection manager with pooling and monitoring."""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        self.connection_pool_size = int(os.getenv("DB_POOL_SIZE", "50"))
        self.max_idle_time = int(os.getenv("DB_MAX_IDLE_TIME", "300000"))  # 5 minutes
        self.server_selection_timeout = int(os.getenv("DB_SELECTION_TIMEOUT", "5000"))  # 5 seconds
        self.socket_timeout = int(os.getenv("DB_SOCKET_TIMEOUT", "10000"))  # 10 seconds
        self.connect_timeout = int(os.getenv("DB_CONNECT_TIMEOUT", "10000"))  # 10 seconds
        self.retry_writes = True
        self.read_preference = "primary"
        
        # Connection state tracking
        self.connection_attempts = 0
        self.last_connection_attempt = None
        self.connection_errors = []
        self.is_connected = False
        self.stats = {
            "total_connections": 0,
            "failed_connections": 0,
            "last_successful_connection": None,
            "last_failed_connection": None,
            "current_connections": 0
        }
        
    def _get_connection_string(self) -> str:
        """Build optimized MongoDB connection string."""
        # First, check if MONGODB_URI is set (preferred for production)
        mongodb_uri = os.getenv("MONGODB_URI")
        if mongodb_uri:
            # Parse existing URI and add optimization parameters
            base_uri = mongodb_uri
            
            # Check if URI already has query parameters
            if "?" in base_uri:
                # Add optimization parameters to existing query string
                optimization_params = [
                    f"maxPoolSize={self.connection_pool_size}",
                    f"maxIdleTimeMS={self.max_idle_time}",
                    f"serverSelectionTimeoutMS={self.server_selection_timeout}",
                    f"socketTimeoutMS={self.socket_timeout}",
                    f"connectTimeoutMS={self.connect_timeout}",
                    f"retryWrites={str(self.retry_writes).lower()}",
                    "waitQueueTimeoutMS=5000",
                    "heartbeatFrequencyMS=10000",
                    "minPoolSize=5",
                    "maxConnecting=10"
                ]
                
                # Only add params that aren't already in the URI
                existing_params = base_uri.split("?")[1].lower()
                new_params = []
                for param in optimization_params:
                    param_name = param.split("=")[0].lower()
                    if param_name not in existing_params:
                        new_params.append(param)
                
                if new_params:
                    base_uri += "&" + "&".join(new_params)
            else:
                # Add all optimization parameters
                options = [
                    f"maxPoolSize={self.connection_pool_size}",
                    f"maxIdleTimeMS={self.max_idle_time}",
                    f"serverSelectionTimeoutMS={self.server_selection_timeout}",
                    f"socketTimeoutMS={self.socket_timeout}",
                    f"connectTimeoutMS={self.connect_timeout}",
                    f"retryWrites={str(self.retry_writes).lower()}",
                    f"readPreference={self.read_preference}",
                    "waitQueueTimeoutMS=5000",
                    "heartbeatFrequencyMS=10000",
                    "minPoolSize=5",
                    "maxConnecting=10"
                ]
                base_uri += "?" + "&".join(options)
            
            return base_uri
        
        # Fallback to individual environment variables for local development
        host = os.getenv("MONGO_HOST", "localhost")
        port = os.getenv("MONGO_PORT", "27017")
        username = os.getenv("MONGO_USERNAME")
        password = os.getenv("MONGO_PASSWORD")
        database = os.getenv("MONGO_DATABASE", "monkeyz")
        
        # Build connection string
        if username and password:
            auth_string = f"{username}:{password}@"
        else:
            auth_string = ""
        
        # Connection options for optimization
        options = [
            f"maxPoolSize={self.connection_pool_size}",
            f"maxIdleTimeMS={self.max_idle_time}",
            f"serverSelectionTimeoutMS={self.server_selection_timeout}",
            f"socketTimeoutMS={self.socket_timeout}",
            f"connectTimeoutMS={self.connect_timeout}",
            f"retryWrites={str(self.retry_writes).lower()}",
            f"readPreference={self.read_preference}",
            "waitQueueTimeoutMS=5000",
            "heartbeatFrequencyMS=10000",
            "minPoolSize=5",
            "maxConnecting=10"
        ]
        
        connection_string = f"mongodb://{auth_string}{host}:{port}/{database}?{'&'.join(options)}"
        return connection_string
    
    async def connect(self, max_retries: int = 3, retry_delay: float = 1.0) -> bool:
        """
        Establish database connection with retry logic.
        
        Args:
            max_retries: Maximum number of connection attempts
            retry_delay: Delay between retry attempts (seconds)
            
        Returns:
            bool: True if connection successful, False otherwise
        """
        self.connection_attempts += 1
        self.last_connection_attempt = datetime.now(timezone.utc)
        
        for attempt in range(max_retries + 1):
            try:
                logger.debug(f"Attempting database connection (attempt {attempt + 1}/{max_retries + 1})")
                
                connection_string = self._get_connection_string()
                
                # Create client with optimized settings
                self.client = AsyncIOMotorClient(
                    connection_string,
                    # Additional connection options
                    tz_aware=True,
                    connect=False,  # Don't connect immediately
                    uuidRepresentation='standard'
                )
                
                # Test the connection
                await self.client.admin.command('ping')
                
                # Get database reference
                database_name = os.getenv("MONGO_DATABASE", "monkeyz")
                self.database = self.client[database_name]
                
                # Verify database access
                await self.database.command('ping')
                
                self.is_connected = True
                self.stats["total_connections"] += 1
                self.stats["last_successful_connection"] = datetime.now(timezone.utc)
                self.stats["current_connections"] = 1
                
                logger.info("Database connection established successfully")
                logger.debug(f"Connection pool size: {self.connection_pool_size}")
                logger.debug(f"Database: {database_name}")
                
                return True
                
            except InvalidURI as e:
                error_msg = f"Invalid MongoDB URI: {e}"
                logger.error(error_msg)
                self.connection_errors.append((datetime.now(timezone.utc), error_msg))
                return False  # Don't retry for URI errors
                
            except (ConnectionFailure, ServerSelectionTimeoutError, NetworkTimeout) as e:
                error_msg = f"Database connection failed (attempt {attempt + 1}): {e}"
                logger.warning(error_msg)
                self.connection_errors.append((datetime.now(timezone.utc), error_msg))
                
                if attempt < max_retries:
                    await asyncio.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    self.stats["failed_connections"] += 1
                    self.stats["last_failed_connection"] = datetime.now(timezone.utc)
                    error_tracker.capture_exception(e, extra_data={
                        "connection_attempts": self.connection_attempts,
                        "max_retries": max_retries
                    })
                    
            except Exception as e:
                error_msg = f"Unexpected database connection error: {e}"
                logger.error(error_msg)
                self.connection_errors.append((datetime.now(timezone.utc), error_msg))
                error_tracker.capture_exception(e)
                return False
        
        self.is_connected = False
        return False
    
    async def disconnect(self) -> None:
        """Properly close database connections."""
        if self.client:
            try:
                logger.debug("Closing database connections...")
                self.client.close()
                self.is_connected = False
                self.stats["current_connections"] = 0
                logger.debug("Database connections closed successfully")
            except Exception as e:
                logger.error(f"Error closing database connection: {e}")
                error_tracker.capture_exception(e)
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform comprehensive database health check.
        
        Returns:
            Dict containing health status and metrics
        """
        if not self.client or not self.database:
            return {
                "status": "disconnected",
                "error": "No database connection"
            }
        
        try:
            start_time = time.time()
            
            # Test basic connectivity
            await self.client.admin.command('ping')
            
            # Test database operations
            await self.database.command('ping')
            
            # Get server info
            server_info = await self.client.admin.command('buildInfo')
            
            # Get database stats
            db_stats = await self.database.command('dbStats')
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "server_version": server_info.get('version'),
                "database_size_mb": round(db_stats.get('dataSize', 0) / (1024 * 1024), 2),
                "collections": db_stats.get('collections', 0),
                "indexes": db_stats.get('indexes', 0),
                "connection_stats": self.stats.copy()
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "connection_stats": self.stats.copy()
            }
    
    async def get_database(self) -> AsyncIOMotorDatabase:
        """
        Get database instance with connection validation.
        
        Returns:
            AsyncIOMotorDatabase instance
            
        Raises:
            ConnectionError: If database is not connected
        """
        if not self.is_connected or self.database is None:
            # Attempt to reconnect
            if not await self.connect():
                raise ConnectionError("Database connection failed")
        
        return self.database
    
    async def get_client(self) -> AsyncIOMotorClient:
        """
        Get client instance with connection validation.
        
        Returns:
            AsyncIOMotorClient instance
            
        Raises:
            ConnectionError: If database is not connected
        """
        if not self.is_connected or self.client is None:
            if not await self.connect():
                raise ConnectionError("Database connection failed")
        
        return self.client
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get current connection statistics."""
        return {
            "is_connected": self.is_connected,
            "connection_attempts": self.connection_attempts,
            "last_connection_attempt": self.last_connection_attempt,
            "recent_errors": self.connection_errors[-5:],  # Last 5 errors
            "stats": self.stats.copy(),
            "pool_size": self.connection_pool_size,
            "timeouts": {
                "server_selection": self.server_selection_timeout,
                "socket": self.socket_timeout,
                "connect": self.connect_timeout
            }
        }

# Global database manager instance
db_manager = DatabaseConnectionManager()

async def get_database() -> AsyncIOMotorDatabase:
    """Global function to get database instance."""
    return await db_manager.get_database()

async def get_client() -> AsyncIOMotorClient:
    """Global function to get client instance."""
    return await db_manager.get_client()

async def initialize_database() -> bool:
    """Initialize database connection on startup."""
    logger.info("Initializing database connection...")
    success = await db_manager.connect(max_retries=5, retry_delay=2.0)
    if success:
        logger.info("Database initialization completed successfully")
    else:
        logger.error("Database initialization failed")
    return success

async def cleanup_database() -> None:
    """Cleanup database connections on shutdown."""
    logger.info("Cleaning up database connections...")
    await db_manager.disconnect()
    logger.info("Database cleanup completed")
