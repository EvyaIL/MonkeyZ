"""
Rate limiting middleware for FastAPI application.
Implements both global rate limiting and specific limits for authentication endpoints.
"""

import time
import asyncio
from collections import defaultdict, deque
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

from ..lib.logging_config import get_logger, log_rate_limit_exceeded, log_authentication_failure

logger = get_logger(__name__)

class RateLimiter:
    def __init__(self):
        # Store request timestamps per IP/user
        self.request_history: Dict[str, deque] = defaultdict(lambda: deque())
        # Track failed login attempts
        self.failed_attempts: Dict[str, deque] = defaultdict(lambda: deque())
        # Track temporary bans
        self.banned_ips: Dict[str, float] = {}
        
        # Rate limit configurations
        self.GENERAL_LIMIT = 100  # requests per minute for general endpoints
        self.AUTH_LIMIT = 5       # requests per minute for auth endpoints
        self.LOGIN_ATTEMPT_LIMIT = 5  # failed attempts before temp ban
        self.BAN_DURATION = 900   # 15 minutes ban duration
        self.WINDOW_SIZE = 60     # 1 minute window
        
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers first (for reverse proxy setups)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
            
        # Fallback to direct connection IP
        if hasattr(request.client, 'host'):
            return request.client.host
        return "unknown"
    
    def _cleanup_old_requests(self, request_queue: deque, window_size: int = None) -> None:
        """Remove requests older than the time window."""
        if window_size is None:
            window_size = self.WINDOW_SIZE
            
        current_time = time.time()
        cutoff_time = current_time - window_size
        
        while request_queue and request_queue[0] < cutoff_time:
            request_queue.popleft()
    
    def _is_banned(self, client_ip: str) -> bool:
        """Check if IP is currently banned."""
        if client_ip in self.banned_ips:
            if time.time() < self.banned_ips[client_ip]:
                return True
            else:
                # Ban expired, remove it
                del self.banned_ips[client_ip]
        return False
    
    def _ban_ip(self, client_ip: str) -> None:
        """Temporarily ban an IP address."""
        ban_until = time.time() + self.BAN_DURATION
        self.banned_ips[client_ip] = ban_until
        logger.warning(f"IP {client_ip} has been temporarily banned until {ban_until}")
    
    async def check_rate_limit(self, request: Request, is_auth_endpoint: bool = False) -> Optional[JSONResponse]:
        """
        Check if request should be rate limited.
        Returns JSONResponse with error if limited, None if allowed.
        """
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Check if IP is banned
        if self._is_banned(client_ip):
            logger.warning(f"Blocked request from banned IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Your IP has been temporarily banned due to too many failed attempts. Please try again later.",
                    "retry_after": int(self.banned_ips[client_ip] - current_time)
                }
            )
        
        # Get request history for this IP
        request_queue = self.request_history[client_ip]
        
        # Clean up old requests
        self._cleanup_old_requests(request_queue)
        
        # Determine rate limit based on endpoint type
        limit = self.AUTH_LIMIT if is_auth_endpoint else self.GENERAL_LIMIT
        
        # Check if limit exceeded
        if len(request_queue) >= limit:
            log_rate_limit_exceeded(client_ip, str(request.url.path))
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Maximum {limit} requests per minute allowed.",
                    "retry_after": 60
                }
            )
        
        # Add current request to history
        request_queue.append(current_time)
        return None
    
    def record_failed_login(self, client_ip: str) -> bool:
        """
        Record a failed login attempt.
        Returns True if IP should be banned, False otherwise.
        """
        current_time = time.time()
        failed_queue = self.failed_attempts[client_ip]
        
        # Clean up old failed attempts (5 minute window for login attempts)
        self._cleanup_old_requests(failed_queue, window_size=300)
        
        # Add current failed attempt
        failed_queue.append(current_time)
        
        # Check if we should ban this IP
        if len(failed_queue) >= self.LOGIN_ATTEMPT_LIMIT:
            self._ban_ip(client_ip)
            # Clear failed attempts since IP is now banned
            failed_queue.clear()
            return True
        
        logger.warning(f"Failed login attempt from IP {client_ip}. Count: {len(failed_queue)}/{self.LOGIN_ATTEMPT_LIMIT}")
        return False
    
    def record_successful_login(self, client_ip: str) -> None:
        """Clear failed login attempts for IP after successful login."""
        if client_ip in self.failed_attempts:
            self.failed_attempts[client_ip].clear()
            logger.info(f"Cleared failed login attempts for IP {client_ip} after successful login")

# Global rate limiter instance
rate_limiter = RateLimiter()

async def rate_limit_middleware(request: Request, call_next):
    """FastAPI middleware for rate limiting."""
    # Determine if this is an auth endpoint
    is_auth_endpoint = any(auth_path in str(request.url.path) for auth_path in [
        "/auth/login", "/auth/register", "/auth/", "/users/login", "/admin/login"
    ])
    
    # Check rate limit
    rate_limit_response = await rate_limiter.check_rate_limit(request, is_auth_endpoint)
    if rate_limit_response:
        return rate_limit_response
    
    # Process request
    response = await call_next(request)
    return response
