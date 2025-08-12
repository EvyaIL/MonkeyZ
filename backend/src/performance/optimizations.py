"""
Backend Performance Optimizations for MonkeyZ
Add these optimizations to your FastAPI application
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_cache.decorator import cache
import redis.asyncio as redis
import asyncio
import time
import logging
from typing import Optional
import uvloop

# Set up async event loop optimization
asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

class PerformanceMiddleware:
    """Middleware to track request performance"""
    
    def __init__(self, app: FastAPI):
        self.app = app
    
    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        
        # Add request ID for tracking
        request_id = f"{int(start_time * 1000)}_{hash(request.url.path) % 10000}"
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        # Log slow requests
        if process_time > 1.0:  # Log requests slower than 1 second
            logging.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
        
        return response

def setup_performance_optimizations(app: FastAPI):
    """
    Setup all performance optimizations for the FastAPI app
    """
    
    # 1. GZIP Compression
    app.add_middleware(
        GZipMiddleware, 
        minimum_size=1000,  # Only compress responses larger than 1KB
        compresslevel=6     # Balance between compression ratio and speed
    )
    
    # 2. Performance monitoring middleware
    app.add_middleware(PerformanceMiddleware)
    
    # 3. Optimized CORS settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://monkeyz.co.il", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
        max_age=3600,  # Cache preflight requests for 1 hour
    )

@app.on_event("startup")
async def startup_event():
    """Initialize performance optimizations on startup"""
    
    # Setup Redis cache
    try:
        redis_client = redis.from_url(
            "redis://localhost:6379", 
            encoding="utf8", 
            decode_responses=True,
            max_connections=20,
            retry_on_timeout=True
        )
        
        FastAPICache.init(
            RedisBackend(redis_client), 
            prefix="monkeyz-cache:",
            expire=300  # Default 5 minutes cache
        )
        
        logging.info("✅ Redis cache initialized successfully")
        
    except Exception as e:
        logging.warning(f"⚠️ Redis cache initialization failed: {e}")
        logging.info("📝 Application will continue without caching")

# Caching decorators for different data types
def cache_products(expire: int = 300):
    """Cache product data for 5 minutes by default"""
    return cache(expire=expire, namespace="products")

def cache_orders(expire: int = 60):
    """Cache order data for 1 minute by default"""
    return cache(expire=expire, namespace="orders")

def cache_analytics(expire: int = 900):
    """Cache analytics data for 15 minutes by default"""
    return cache(expire=expire, namespace="analytics")

def cache_user_data(expire: int = 180):
    """Cache user data for 3 minutes by default"""
    return cache(expire=expire, namespace="users")

# Example optimized endpoints
from fastapi import Depends
from typing import List

@app.get("/api/products")
@cache_products(expire=600)  # Cache for 10 minutes
async def get_products_optimized(
    skip: int = 0, 
    limit: int = 50,  # Reduced default limit
    category: Optional[str] = None
):
    """
    Optimized products endpoint with caching and pagination
    """
    # Your existing product fetching logic here
    # This will now be cached automatically
    pass

@app.get("/api/admin/analytics")
@cache_analytics(expire=1800)  # Cache for 30 minutes
async def get_admin_analytics():
    """
    Cached analytics endpoint - expensive operations cached for longer
    """
    # Your existing analytics logic here
    pass

# Database connection optimization
class OptimizedDatabase:
    """Optimized database connection with connection pooling"""
    
    def __init__(self):
        self.pool_size = 10
        self.max_overflow = 20
        self.pool_timeout = 30
        self.pool_recycle = 3600
    
    async def get_connection_pool(self):
        """Get optimized connection pool"""
        # Configure your MongoDB connection pool here
        # Example for motor (MongoDB async driver):
        """
        from motor.motor_asyncio import AsyncIOMotorClient
        
        client = AsyncIOMotorClient(
            "mongodb://localhost:27017",
            maxPoolSize=self.pool_size,
            minPoolSize=5,
            maxIdleTimeMS=30000,
            waitQueueTimeoutMS=5000,
            serverSelectionTimeoutMS=5000
        )
        """
        pass

# Background task optimization
from fastapi import BackgroundTasks

class TaskQueue:
    """Optimized background task processing"""
    
    def __init__(self):
        self.max_concurrent_tasks = 5
        self.task_semaphore = asyncio.Semaphore(self.max_concurrent_tasks)
    
    async def add_task(self, task_func, *args, **kwargs):
        """Add task with concurrency control"""
        async with self.task_semaphore:
            await task_func(*args, **kwargs)

# Email optimization
async def send_email_optimized(to: str, subject: str, body: str):
    """
    Optimized email sending with connection pooling and retry logic
    """
    max_retries = 3
    retry_delay = 1
    
    for attempt in range(max_retries):
        try:
            # Your email sending logic here
            # Use connection pooling for SMTP
            break
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
            else:
                logging.error(f"Failed to send email after {max_retries} attempts: {e}")

# Response optimization
from fastapi.responses import JSONResponse
from typing import Any

class OptimizedJSONResponse(JSONResponse):
    """Optimized JSON response with better serialization"""
    
    def render(self, content: Any) -> bytes:
        # Custom JSON serialization for better performance
        import orjson  # Faster JSON library
        return orjson.dumps(content, option=orjson.OPT_NON_STR_KEYS)

# Usage in endpoints:
@app.get("/api/fast-endpoint")
async def fast_endpoint():
    return OptimizedJSONResponse({"message": "Fast response"})

# Health check optimization
@app.get("/health")
async def health_check():
    """Lightweight health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

# Database query optimization helpers
class QueryOptimizer:
    """Helper class for optimizing database queries"""
    
    @staticmethod
    def optimize_aggregation_pipeline(pipeline: List[dict]) -> List[dict]:
        """Optimize MongoDB aggregation pipeline"""
        # Add $limit early in pipeline to reduce processed documents
        # Add indexes hints
        # Use $project to limit fields
        return pipeline
    
    @staticmethod
    def add_indexes_hints(query: dict, collection_name: str) -> dict:
        """Add index hints based on collection and query pattern"""
        index_hints = {
            "products": {"category": 1, "price": 1},
            "orders": {"userId": 1, "createdAt": -1},
            "users": {"email": 1}
        }
        
        if collection_name in index_hints:
            query["hint"] = index_hints[collection_name]
        
        return query

# Startup optimization
def optimize_startup():
    """Optimize application startup"""
    
    # Preload critical data
    # Warm up cache
    # Initialize connection pools
    # Setup monitoring
    
    logging.info("🚀 MonkeyZ backend optimizations loaded successfully!")

# Export optimizations
__all__ = [
    'setup_performance_optimizations',
    'cache_products',
    'cache_orders', 
    'cache_analytics',
    'cache_user_data',
    'OptimizedDatabase',
    'TaskQueue',
    'OptimizedJSONResponse',
    'QueryOptimizer',
    'optimize_startup'
]
