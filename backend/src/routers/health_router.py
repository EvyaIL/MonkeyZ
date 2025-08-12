"""
Health check endpoints for monitoring application status.
Provides detailed health information for different components.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import asyncio
import time
from datetime import datetime, timezone
import psutil
import os

from ..mongodb.mongodb import MongoDb
from ..deps.deps import get_product_collection_dependency
from ..lib.logging_config import get_logger

logger = get_logger(__name__)
health_router = APIRouter()

class HealthChecker:
    """Health check utility class."""
    
    def __init__(self):
        self.mongo_db = MongoDb()
        
    async def check_database(self) -> Dict[str, Any]:
        """Check database connectivity and basic operations."""
        try:
            start_time = time.time()
            db = await self.mongo_db.get_db()
            
            # Test basic connectivity
            await db.command("ping")
            
            # Test collection access
            collections = await db.list_collection_names()
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "collections_count": len(collections),
                "available_collections": collections[:5]  # Limit output
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def check_products_service(self) -> Dict[str, Any]:
        """Check products service functionality."""
        try:
            start_time = time.time()
            db = await self.mongo_db.get_db()
            
            # Test product collection access
            products_count = await db.products.count_documents({"active": True})
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2),
                "active_products_count": products_count
            }
        except Exception as e:
            logger.error(f"Products service health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "status": "healthy",
                "cpu_usage_percent": cpu_percent,
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "usage_percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "usage_percent": round((disk.used / disk.total) * 100, 2)
                }
            }
        except Exception as e:
            logger.error(f"System resources health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }

# Global health checker instance
health_checker = HealthChecker()

@health_router.get("/health")
async def basic_health_check():
    """Basic health check endpoint for load balancers."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "MonkeyZ API"
    }

@health_router.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with component status."""
    start_time = time.time()
    
    # Run all health checks concurrently
    try:
        database_check, products_check, system_check = await asyncio.gather(
            health_checker.check_database(),
            health_checker.check_products_service(),
            asyncio.to_thread(health_checker.check_system_resources)
        )
        
        total_time = (time.time() - start_time) * 1000
        
        # Determine overall status
        all_healthy = all(
            check.get("status") == "healthy" 
            for check in [database_check, products_check, system_check]
        )
        
        response = {
            "status": "healthy" if all_healthy else "degraded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_check_time_ms": round(total_time, 2),
            "checks": {
                "database": database_check,
                "products_service": products_check,
                "system_resources": system_check
            },
            "environment": {
                "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
                "environment": os.getenv("ENVIRONMENT", "development"),
                "log_level": os.getenv("LOG_LEVEL", "INFO")
            }
        }
        
        if not all_healthy:
            logger.warning("Health check detected degraded service status")
            
        return response
        
    except Exception as e:
        logger.error(f"Health check failed with exception: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(e)
        }

@health_router.get("/health/ready")
async def readiness_check():
    """Kubernetes-style readiness check."""
    try:
        # Check if database is ready
        db_check = await health_checker.check_database()
        
        if db_check.get("status") != "healthy":
            raise HTTPException(status_code=503, detail="Service not ready")
            
        return {
            "status": "ready",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

@health_router.get("/health/live")
async def liveness_check():
    """Kubernetes-style liveness check."""
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": time.time() - psutil.Process().create_time()
    }
