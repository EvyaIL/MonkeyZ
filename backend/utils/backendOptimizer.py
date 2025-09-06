"""
Ultra-Fast Backend Performance Optimizer for MonkeyZ
Comprehensive FastAPI optimization with advanced caching, compression, and monitoring
"""

import asyncio
import time
import gzip
import json
import hashlib
from typing import Dict, Any, Optional, List, Callable
from functools import wraps, lru_cache
from collections import defaultdict, deque
import asyncio
from datetime import datetime, timedelta
import logging
import psutil
import gc
import sys
from contextlib import asynccontextmanager
import aioredis
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import uvloop
import orjson


class PerformanceMetrics:
    """Advanced performance monitoring and metrics collection"""
    
    def __init__(self):
        self.request_times = defaultdict(deque)
        self.endpoint_stats = defaultdict(lambda: {
            'count': 0,
            'total_time': 0,
            'avg_time': 0,
            'min_time': float('inf'),
            'max_time': 0,
            'error_count': 0
        })
        self.cache_stats = {
            'hits': 0,
            'misses': 0,
            'hit_rate': 0.0
        }
        self.memory_usage = deque(maxlen=1000)
        self.active_connections = 0
        self.total_requests = 0
        self.startup_time = time.time()
        
    def record_request(self, endpoint: str, duration: float, status_code: int):
        """Record request performance metrics"""
        self.total_requests += 1
        stats = self.endpoint_stats[endpoint]
        
        stats['count'] += 1
        stats['total_time'] += duration
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['min_time'] = min(stats['min_time'], duration)
        stats['max_time'] = max(stats['max_time'], duration)
        
        if status_code >= 400:
            stats['error_count'] += 1
        
        # Keep last 1000 request times for percentile calculations
        self.request_times[endpoint].append(duration)
        if len(self.request_times[endpoint]) > 1000:
            self.request_times[endpoint].popleft()
    
    def record_cache_hit(self):
        self.cache_stats['hits'] += 1
        self._update_cache_hit_rate()
    
    def record_cache_miss(self):
        self.cache_stats['misses'] += 1
        self._update_cache_hit_rate()
    
    def _update_cache_hit_rate(self):
        total = self.cache_stats['hits'] + self.cache_stats['misses']
        if total > 0:
            self.cache_stats['hit_rate'] = self.cache_stats['hits'] / total
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics"""
        process = psutil.Process()
        
        return {
            'cpu_percent': psutil.cpu_percent(interval=0.1),
            'memory_percent': psutil.virtual_memory().percent,
            'memory_mb': process.memory_info().rss / 1024 / 1024,
            'open_files': len(process.open_files()),
            'threads': process.num_threads(),
            'uptime_seconds': time.time() - self.startup_time
        }
    
    def get_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary"""
        system_metrics = self.get_system_metrics()
        
        return {
            'system': system_metrics,
            'requests': {
                'total': self.total_requests,
                'active_connections': self.active_connections,
                'endpoints': dict(self.endpoint_stats)
            },
            'cache': self.cache_stats,
            'performance': {
                'startup_time': self.startup_time,
                'uptime': time.time() - self.startup_time
            }
        }


class UltraFastCache:
    """High-performance in-memory cache with TTL and compression"""
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 300):
        self.cache = {}
        self.access_times = {}
        self.ttl_cache = {}
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.metrics = PerformanceMetrics()
    
    def _generate_key(self, key: str, *args, **kwargs) -> str:
        """Generate cache key from function arguments"""
        if args or kwargs:
            key_data = f"{key}:{args}:{sorted(kwargs.items())}"
            return hashlib.md5(key_data.encode()).hexdigest()
        return key
    
    def _is_expired(self, key: str) -> bool:
        """Check if cache entry is expired"""
        if key not in self.ttl_cache:
            return True
        return time.time() > self.ttl_cache[key]
    
    def _compress_data(self, data: Any) -> bytes:
        """Compress data using gzip"""
        json_str = orjson.dumps(data)
        return gzip.compress(json_str)
    
    def _decompress_data(self, compressed_data: bytes) -> Any:
        """Decompress gzipped data"""
        json_str = gzip.decompress(compressed_data)
        return orjson.loads(json_str)
    
    def _evict_if_needed(self):
        """Evict least recently used items if cache is full"""
        if len(self.cache) >= self.max_size:
            # Remove expired items first
            expired_keys = [k for k in self.cache.keys() if self._is_expired(k)]
            for key in expired_keys:
                self._remove_key(key)
            
            # If still over limit, remove LRU items
            if len(self.cache) >= self.max_size:
                lru_keys = sorted(
                    self.access_times.items(), 
                    key=lambda x: x[1]
                )[:len(self.cache) - self.max_size + 100]
                
                for key, _ in lru_keys:
                    self._remove_key(key)
    
    def _remove_key(self, key: str):
        """Remove key from all cache structures"""
        self.cache.pop(key, None)
        self.access_times.pop(key, None)
        self.ttl_cache.pop(key, None)
    
    async def get(self, key: str, *args, **kwargs) -> Optional[Any]:
        """Get value from cache"""
        cache_key = self._generate_key(key, *args, **kwargs)
        
        if cache_key in self.cache and not self._is_expired(cache_key):
            self.access_times[cache_key] = time.time()
            self.metrics.record_cache_hit()
            
            try:
                return self._decompress_data(self.cache[cache_key])
            except Exception:
                # If decompression fails, remove the key
                self._remove_key(cache_key)
                self.metrics.record_cache_miss()
                return None
        
        self.metrics.record_cache_miss()
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None, *args, **kwargs):
        """Set value in cache"""
        cache_key = self._generate_key(key, *args, **kwargs)
        ttl = ttl or self.default_ttl
        
        try:
            compressed_value = self._compress_data(value)
            
            self._evict_if_needed()
            
            self.cache[cache_key] = compressed_value
            self.access_times[cache_key] = time.time()
            self.ttl_cache[cache_key] = time.time() + ttl
            
        except Exception as e:
            logging.error(f"Cache set error: {e}")
    
    async def delete(self, key: str, *args, **kwargs):
        """Delete key from cache"""
        cache_key = self._generate_key(key, *args, **kwargs)
        self._remove_key(cache_key)
    
    async def clear(self):
        """Clear entire cache"""
        self.cache.clear()
        self.access_times.clear()
        self.ttl_cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hit_rate': self.metrics.cache_stats['hit_rate'],
            'hits': self.metrics.cache_stats['hits'],
            'misses': self.metrics.cache_stats['misses']
        }


class PerformanceMiddleware(BaseHTTPMiddleware):
    """High-performance middleware for request optimization"""
    
    def __init__(self, app, metrics: PerformanceMetrics):
        super().__init__(app)
        self.metrics = metrics
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        self.metrics.active_connections += 1
        
        try:
            # Add compression headers
            response = await call_next(request)
            
            # Calculate request duration
            duration = time.time() - start_time
            
            # Record metrics
            endpoint = f"{request.method} {request.url.path}"
            self.metrics.record_request(endpoint, duration, response.status_code)
            
            # Add performance headers
            response.headers["X-Response-Time"] = f"{duration:.3f}s"
            response.headers["X-Request-ID"] = str(id(request))
            
            return response
            
        finally:
            self.metrics.active_connections -= 1


class BackendOptimizer:
    """Main backend optimization controller"""
    
    def __init__(self):
        self.cache = UltraFastCache()
        self.metrics = PerformanceMetrics()
        self.background_tasks = set()
        
    def setup_app(self, app: FastAPI):
        """Configure FastAPI app with all optimizations"""
        
        # Add performance middleware
        app.add_middleware(PerformanceMiddleware, metrics=self.metrics)
        
        # Add CORS with optimized settings
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure appropriately for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            max_age=86400,  # Cache preflight requests for 24 hours
        )
        
        # Add GZip compression
        app.add_middleware(GZipMiddleware, minimum_size=1000)
        
        # Custom JSON response class for faster serialization
        @app.middleware("http")
        async def json_optimization_middleware(request: Request, call_next):
            response = await call_next(request)
            
            # Use orjson for faster JSON serialization
            if hasattr(response, 'body') and isinstance(response, JSONResponse):
                if response.media_type == "application/json":
                    response.body = orjson.dumps(response.body)
            
            return response
        
        # Health check endpoint with metrics
        @app.get("/health")
        async def health_check():
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "metrics": self.metrics.get_summary()
            }
        
        # Performance metrics endpoint
        @app.get("/metrics")
        async def get_metrics():
            return self.metrics.get_summary()
        
        # Cache stats endpoint
        @app.get("/cache/stats")
        async def get_cache_stats():
            return self.cache.get_stats()
        
        # Cache clear endpoint (for development)
        @app.post("/cache/clear")
        async def clear_cache():
            await self.cache.clear()
            return {"status": "cache cleared"}
        
        # Start background tasks
        self.start_background_tasks()
    
    def cached(self, ttl: int = 300, key_prefix: str = ""):
        """Decorator for caching function results"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                func_name = f"{key_prefix}{func.__module__}.{func.__name__}"
                
                # Check cache first
                cached_result = await self.cache.get(func_name, *args, **kwargs)
                if cached_result is not None:
                    return cached_result
                
                # Execute function and cache result
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                await self.cache.set(func_name, result, ttl, *args, **kwargs)
                return result
            
            return wrapper
        return decorator
    
    def start_background_tasks(self):
        """Start background optimization tasks"""
        
        async def memory_cleanup():
            """Periodic memory cleanup"""
            while True:
                try:
                    # Force garbage collection
                    gc.collect()
                    
                    # Record memory usage
                    process = psutil.Process()
                    memory_mb = process.memory_info().rss / 1024 / 1024
                    self.metrics.memory_usage.append({
                        'timestamp': time.time(),
                        'memory_mb': memory_mb
                    })
                    
                    # Log if memory usage is high
                    if memory_mb > 1000:  # 1GB
                        logging.warning(f"High memory usage: {memory_mb:.2f} MB")
                    
                    await asyncio.sleep(30)  # Run every 30 seconds
                    
                except Exception as e:
                    logging.error(f"Memory cleanup error: {e}")
                    await asyncio.sleep(60)
        
        # Start background task
        task = asyncio.create_task(memory_cleanup())
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)
    
    def optimize_database_queries(self):
        """Database query optimization utilities"""
        
        def batch_queries(batch_size: int = 100):
            """Decorator to batch database queries"""
            def decorator(func):
                @wraps(func)
                async def wrapper(items):
                    results = []
                    for i in range(0, len(items), batch_size):
                        batch = items[i:i + batch_size]
                        batch_result = await func(batch)
                        results.extend(batch_result)
                    return results
                return wrapper
            return decorator
        
        return batch_queries
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary"""
        return {
            "cache": self.cache.get_stats(),
            "system": self.metrics.get_summary(),
            "optimization_status": {
                "uvloop": "uvloop" in sys.modules,
                "orjson": "orjson" in sys.modules,
                "background_tasks": len(self.background_tasks)
            }
        }


# Global optimizer instance
backend_optimizer = BackendOptimizer()

# Utility functions for common optimizations
@lru_cache(maxsize=1000)
def cached_computation(data: str) -> Any:
    """Example of using LRU cache for expensive computations"""
    # Expensive computation here
    return {"processed": data, "timestamp": time.time()}

async def optimize_json_response(data: Any) -> Response:
    """Create optimized JSON response"""
    return Response(
        content=orjson.dumps(data),
        media_type="application/json",
        headers={
            "Cache-Control": "public, max-age=300",
            "Content-Encoding": "gzip"
        }
    )

# Configure uvloop for better async performance
try:
    import uvloop
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    logging.info("uvloop enabled for better async performance")
except ImportError:
    logging.warning("uvloop not available, using default event loop")

logging.info("Backend optimizer initialized successfully")
