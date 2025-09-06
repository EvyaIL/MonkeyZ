"""
Ultra-Fast Database Performance Optimizer for MonkeyZ
Advanced database optimization, connection pooling, query caching, and monitoring
"""

import asyncio
import time
import logging
import hashlib
from typing import Dict, Any, List, Optional, Union, Callable
from functools import wraps
from collections import defaultdict, deque
from contextlib import asynccontextmanager
import json
from datetime import datetime, timedelta
import asyncpg
import aiomysql
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy import text, select, update, delete, insert
from sqlalchemy.orm import selectinload, joinedload
import redis.asyncio as redis


class QueryCache:
    """High-performance query result caching system"""
    
    def __init__(self, redis_url: str = None, max_memory_cache: int = 10000):
        self.memory_cache = {}
        self.cache_times = {}
        self.cache_access = {}
        self.max_memory_cache = max_memory_cache
        self.redis_client = None
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0
        }
        
        if redis_url:
            asyncio.create_task(self._init_redis(redis_url))
    
    async def _init_redis(self, redis_url: str):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            await self.redis_client.ping()
            logging.info("Redis cache connected successfully")
        except Exception as e:
            logging.error(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def _generate_cache_key(self, query: str, params: tuple = ()) -> str:
        """Generate cache key from query and parameters"""
        cache_data = f"{query}:{params}"
        return f"db_cache:{hashlib.md5(cache_data.encode()).hexdigest()}"
    
    def _evict_lru(self):
        """Evict least recently used items from memory cache"""
        if len(self.memory_cache) >= self.max_memory_cache:
            # Sort by last access time and remove oldest 20%
            sorted_items = sorted(
                self.cache_access.items(), 
                key=lambda x: x[1]
            )
            
            evict_count = max(1, len(sorted_items) // 5)
            for key, _ in sorted_items[:evict_count]:
                self.memory_cache.pop(key, None)
                self.cache_times.pop(key, None)
                self.cache_access.pop(key, None)
                self.stats['evictions'] += 1
    
    async def get(self, query: str, params: tuple = (), ttl: int = 300) -> Optional[Any]:
        """Get cached query result"""
        cache_key = self._generate_cache_key(query, params)
        
        # Check memory cache first
        if cache_key in self.memory_cache:
            cache_time = self.cache_times.get(cache_key, 0)
            if time.time() - cache_time < ttl:
                self.cache_access[cache_key] = time.time()
                self.stats['hits'] += 1
                return self.memory_cache[cache_key]
            else:
                # Expired, remove from memory cache
                self.memory_cache.pop(cache_key, None)
                self.cache_times.pop(cache_key, None)
                self.cache_access.pop(cache_key, None)
        
        # Check Redis cache if available
        if self.redis_client:
            try:
                cached_data = await self.redis_client.get(cache_key)
                if cached_data:
                    result = json.loads(cached_data)
                    # Store in memory cache for faster future access
                    self._evict_lru()
                    self.memory_cache[cache_key] = result
                    self.cache_times[cache_key] = time.time()
                    self.cache_access[cache_key] = time.time()
                    self.stats['hits'] += 1
                    return result
            except Exception as e:
                logging.error(f"Redis cache get error: {e}")
        
        self.stats['misses'] += 1
        return None
    
    async def set(self, query: str, params: tuple, result: Any, ttl: int = 300):
        """Cache query result"""
        cache_key = self._generate_cache_key(query, params)
        
        try:
            # Store in memory cache
            self._evict_lru()
            self.memory_cache[cache_key] = result
            self.cache_times[cache_key] = time.time()
            self.cache_access[cache_key] = time.time()
            
            # Store in Redis if available
            if self.redis_client:
                try:
                    await self.redis_client.setex(
                        cache_key, 
                        ttl, 
                        json.dumps(result, default=str)
                    )
                except Exception as e:
                    logging.error(f"Redis cache set error: {e}")
                    
        except Exception as e:
            logging.error(f"Cache set error: {e}")
    
    async def invalidate_pattern(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        # Invalidate memory cache
        keys_to_remove = [
            key for key in self.memory_cache.keys() 
            if pattern in key
        ]
        
        for key in keys_to_remove:
            self.memory_cache.pop(key, None)
            self.cache_times.pop(key, None)
            self.cache_access.pop(key, None)
        
        # Invalidate Redis cache
        if self.redis_client:
            try:
                keys = await self.redis_client.keys(f"*{pattern}*")
                if keys:
                    await self.redis_client.delete(*keys)
            except Exception as e:
                logging.error(f"Redis cache invalidation error: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.stats['hits'] + self.stats['misses']
        hit_rate = (self.stats['hits'] / total * 100) if total > 0 else 0
        
        return {
            'memory_cache_size': len(self.memory_cache),
            'max_memory_cache': self.max_memory_cache,
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'hit_rate_percent': round(hit_rate, 2),
            'evictions': self.stats['evictions'],
            'redis_connected': self.redis_client is not None
        }


class DatabaseOptimizer:
    """Advanced database optimization and monitoring system"""
    
    def __init__(self, database_url: str, redis_url: str = None):
        self.database_url = database_url
        self.engine = None
        self.session_factory = None
        self.query_cache = QueryCache(redis_url)
        self.connection_pool = None
        
        # Performance monitoring
        self.query_stats = defaultdict(lambda: {
            'count': 0,
            'total_time': 0,
            'avg_time': 0,
            'min_time': float('inf'),
            'max_time': 0
        })
        self.slow_queries = deque(maxlen=100)
        self.active_connections = 0
        self.total_queries = 0
    
    async def initialize(self):
        """Initialize database connections and optimizations"""
        try:
            # Create optimized engine with connection pooling
            self.engine = create_async_engine(
                self.database_url,
                poolclass=QueuePool,
                pool_size=20,  # Base pool size
                max_overflow=30,  # Additional connections
                pool_pre_ping=True,  # Verify connections
                pool_recycle=3600,  # Recycle connections every hour
                echo=False,  # Set to True for query logging
                future=True,
                connect_args={
                    "server_settings": {
                        "application_name": "MonkeyZ_Optimized",
                        "jit": "on",  # Enable JIT compilation for PostgreSQL
                    }
                } if "postgresql" in self.database_url else {}
            )
            
            # Create session factory
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            logging.info("Database optimizer initialized successfully")
            
        except Exception as e:
            logging.error(f"Database initialization error: {e}")
            raise
    
    @asynccontextmanager
    async def get_session(self):
        """Get optimized database session with monitoring"""
        session = self.session_factory()
        self.active_connections += 1
        
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
            self.active_connections -= 1
    
    def cached_query(self, ttl: int = 300, cache_key: str = None):
        """Decorator for caching query results"""
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                if cache_key:
                    query_key = cache_key
                else:
                    query_key = f"{func.__name__}:{args}:{sorted(kwargs.items())}"
                
                # Check cache
                cached_result = await self.query_cache.get(query_key, (), ttl)
                if cached_result is not None:
                    return cached_result
                
                # Execute query and cache result
                start_time = time.time()
                result = await func(*args, **kwargs)
                query_time = time.time() - start_time
                
                # Record query statistics
                self._record_query_stats(func.__name__, query_time)
                
                # Cache result
                await self.query_cache.set(query_key, (), result, ttl)
                
                return result
            
            return wrapper
        return decorator
    
    async def execute_optimized_query(
        self, 
        query: str, 
        params: tuple = (), 
        fetch_all: bool = True,
        cache_ttl: int = 0
    ) -> List[Dict[str, Any]]:
        """Execute optimized database query with caching"""
        
        # Check cache if TTL is specified
        if cache_ttl > 0:
            cached_result = await self.query_cache.get(query, params, cache_ttl)
            if cached_result is not None:
                return cached_result
        
        start_time = time.time()
        
        async with self.get_session() as session:
            try:
                result = await session.execute(text(query), params)
                
                if fetch_all:
                    rows = result.fetchall()
                    # Convert to list of dicts for better serialization
                    data = [dict(row._mapping) for row in rows]
                else:
                    row = result.fetchone()
                    data = dict(row._mapping) if row else None
                
                query_time = time.time() - start_time
                self._record_query_stats(query, query_time)
                
                # Cache result if TTL specified
                if cache_ttl > 0:
                    await self.query_cache.set(query, params, data, cache_ttl)
                
                return data
                
            except Exception as e:
                query_time = time.time() - start_time
                self._record_query_stats(query, query_time, error=True)
                logging.error(f"Query execution error: {e}")
                raise
    
    async def bulk_insert_optimized(
        self, 
        table_name: str, 
        data: List[Dict[str, Any]],
        batch_size: int = 1000
    ):
        """Optimized bulk insert with batching"""
        
        if not data:
            return
        
        start_time = time.time()
        total_inserted = 0
        
        async with self.get_session() as session:
            try:
                # Process in batches for better memory usage
                for i in range(0, len(data), batch_size):
                    batch = data[i:i + batch_size]
                    
                    # Use bulk insert for better performance
                    stmt = text(f"""
                        INSERT INTO {table_name} ({', '.join(batch[0].keys())})
                        VALUES ({', '.join([f':{key}' for key in batch[0].keys()])})
                    """)
                    
                    await session.execute(stmt, batch)
                    total_inserted += len(batch)
                
                query_time = time.time() - start_time
                self._record_query_stats(f"bulk_insert_{table_name}", query_time)
                
                logging.info(f"Bulk inserted {total_inserted} records in {query_time:.3f}s")
                
            except Exception as e:
                logging.error(f"Bulk insert error: {e}")
                raise
    
    async def bulk_update_optimized(
        self, 
        table_name: str, 
        updates: List[Dict[str, Any]],
        key_column: str = 'id',
        batch_size: int = 1000
    ):
        """Optimized bulk update with batching"""
        
        if not updates:
            return
        
        start_time = time.time()
        total_updated = 0
        
        async with self.get_session() as session:
            try:
                # Process in batches
                for i in range(0, len(updates), batch_size):
                    batch = updates[i:i + batch_size]
                    
                    # Create parameterized update query
                    set_clauses = []
                    for key in batch[0].keys():
                        if key != key_column:
                            set_clauses.append(f"{key} = VALUES({key})")
                    
                    values_list = []
                    for item in batch:
                        values = ', '.join([f":{key}" for key in item.keys()])
                        values_list.append(f"({values})")
                    
                    # Use INSERT ... ON DUPLICATE KEY UPDATE for MySQL
                    # or UPSERT for PostgreSQL
                    if "postgresql" in self.database_url:
                        stmt = text(f"""
                            INSERT INTO {table_name} ({', '.join(batch[0].keys())})
                            VALUES {', '.join(values_list)}
                            ON CONFLICT ({key_column})
                            DO UPDATE SET {', '.join(set_clauses)}
                        """)
                    else:
                        stmt = text(f"""
                            INSERT INTO {table_name} ({', '.join(batch[0].keys())})
                            VALUES {', '.join(values_list)}
                            ON DUPLICATE KEY UPDATE {', '.join(set_clauses)}
                        """)
                    
                    await session.execute(stmt, batch)
                    total_updated += len(batch)
                
                query_time = time.time() - start_time
                self._record_query_stats(f"bulk_update_{table_name}", query_time)
                
                logging.info(f"Bulk updated {total_updated} records in {query_time:.3f}s")
                
            except Exception as e:
                logging.error(f"Bulk update error: {e}")
                raise
    
    def _record_query_stats(self, query_identifier: str, duration: float, error: bool = False):
        """Record query performance statistics"""
        self.total_queries += 1
        stats = self.query_stats[query_identifier]
        
        stats['count'] += 1
        
        if not error:
            stats['total_time'] += duration
            stats['avg_time'] = stats['total_time'] / stats['count']
            stats['min_time'] = min(stats['min_time'], duration)
            stats['max_time'] = max(stats['max_time'], duration)
        
        # Record slow queries (> 1 second)
        if duration > 1.0:
            self.slow_queries.append({
                'query': query_identifier,
                'duration': duration,
                'timestamp': datetime.utcnow(),
                'error': error
            })
            logging.warning(f"Slow query detected: {query_identifier} took {duration:.3f}s")
    
    async def optimize_table_indexes(self, table_name: str, columns: List[str]):
        """Create optimized indexes for better query performance"""
        
        async with self.get_session() as session:
            try:
                for column in columns:
                    index_name = f"idx_{table_name}_{column}"
                    
                    # Check if index exists
                    if "postgresql" in self.database_url:
                        check_query = text("""
                            SELECT 1 FROM pg_indexes 
                            WHERE tablename = :table_name AND indexname = :index_name
                        """)
                    else:
                        check_query = text("""
                            SELECT 1 FROM information_schema.statistics 
                            WHERE table_name = :table_name AND index_name = :index_name
                        """)
                    
                    result = await session.execute(check_query, {
                        'table_name': table_name,
                        'index_name': index_name
                    })
                    
                    if not result.fetchone():
                        # Create index
                        create_index = text(f"""
                            CREATE INDEX CONCURRENTLY {index_name} 
                            ON {table_name} ({column})
                        """)
                        await session.execute(create_index)
                        logging.info(f"Created index {index_name}")
                
            except Exception as e:
                logging.error(f"Index creation error: {e}")
    
    async def analyze_table_statistics(self, table_name: str):
        """Update table statistics for better query planning"""
        
        async with self.get_session() as session:
            try:
                if "postgresql" in self.database_url:
                    await session.execute(text(f"ANALYZE {table_name}"))
                else:
                    await session.execute(text(f"ANALYZE TABLE {table_name}"))
                
                logging.info(f"Updated statistics for table {table_name}")
                
            except Exception as e:
                logging.error(f"Table analysis error: {e}")
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive database performance statistics"""
        
        return {
            'connections': {
                'active': self.active_connections,
                'pool_size': self.engine.pool.size() if self.engine else 0,
                'checked_out': self.engine.pool.checkedout() if self.engine else 0
            },
            'queries': {
                'total': self.total_queries,
                'stats': dict(self.query_stats),
                'slow_queries': list(self.slow_queries)
            },
            'cache': self.query_cache.get_stats()
        }
    
    async def cleanup(self):
        """Cleanup database connections"""
        if self.engine:
            await self.engine.dispose()
        
        if self.query_cache.redis_client:
            await self.query_cache.redis_client.close()


# Global database optimizer instance
db_optimizer = None

async def initialize_db_optimizer(database_url: str, redis_url: str = None):
    """Initialize global database optimizer"""
    global db_optimizer
    db_optimizer = DatabaseOptimizer(database_url, redis_url)
    await db_optimizer.initialize()
    return db_optimizer

# Utility functions
def get_db_optimizer() -> DatabaseOptimizer:
    """Get the global database optimizer instance"""
    if db_optimizer is None:
        raise RuntimeError("Database optimizer not initialized")
    return db_optimizer

# Query builder utilities for common patterns
class QueryBuilder:
    """Optimized query builder for common database operations"""
    
    @staticmethod
    def build_paginated_query(
        base_query: str,
        page: int = 1,
        per_page: int = 20,
        order_by: str = 'id',
        order_direction: str = 'ASC'
    ) -> tuple[str, dict]:
        """Build optimized paginated query"""
        
        offset = (page - 1) * per_page
        
        query = f"""
            {base_query}
            ORDER BY {order_by} {order_direction}
            LIMIT :limit OFFSET :offset
        """
        
        params = {
            'limit': per_page,
            'offset': offset
        }
        
        return query, params
    
    @staticmethod
    def build_search_query(
        table: str,
        search_columns: List[str],
        search_term: str,
        additional_filters: Dict[str, Any] = None
    ) -> tuple[str, dict]:
        """Build optimized full-text search query"""
        
        # Use proper full-text search for PostgreSQL
        search_conditions = []
        for column in search_columns:
            search_conditions.append(f"{column} ILIKE :search_term")
        
        where_clause = f"({' OR '.join(search_conditions)})"
        
        if additional_filters:
            filter_conditions = []
            for key, value in additional_filters.items():
                filter_conditions.append(f"{key} = :{key}")
            where_clause += f" AND {' AND '.join(filter_conditions)}"
        
        query = f"""
            SELECT * FROM {table}
            WHERE {where_clause}
        """
        
        params = {
            'search_term': f'%{search_term}%',
            **(additional_filters or {})
        }
        
        return query, params

logging.info("Database optimizer module initialized")
