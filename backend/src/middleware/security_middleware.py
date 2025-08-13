"""
Security middleware for FastAPI application.
Implements comprehensive security headers, CSRF protection, and security policies.
"""

import secrets
import time
from typing import Dict, Optional, Set
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

from ..lib.logging_config import get_logger, log_security_event

logger = get_logger(__name__)

class SecurityHeaders:
    """Security headers configuration."""
    
    # Content Security Policy for production
    CSP_POLICY = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
        "https://www.googletagmanager.com https://www.google-analytics.com "
        "https://js.paypal.com https://www.paypal.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob:; "
        "connect-src 'self' https://api.monkeyz.co.il https://www.google-analytics.com "
        "https://api.paypal.com https://www.paypal.com; "
        "frame-src 'self' https://js.paypal.com https://www.paypal.com; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "upgrade-insecure-requests"
    )
    
    # Development CSP (more relaxed)
    CSP_POLICY_DEV = (
        "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' "
        "http://localhost:3000 https://www.googletagmanager.com "
        "https://js.paypal.com https://www.paypal.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https: blob: http:; "
        "connect-src 'self' ws://localhost:3000 http://localhost:8000 "
        "https://api.paypal.com https://www.paypal.com; "
        "frame-src 'self' https://js.paypal.com https://www.paypal.com"
    )

class CSRFProtection:
    """CSRF protection utility."""
    
    def __init__(self):
        self.tokens: Dict[str, float] = {}  # token -> timestamp
        self.token_lifetime = 3600  # 1 hour
        
    def generate_token(self) -> str:
        """Generate a new CSRF token."""
        token = secrets.token_urlsafe(32)
        self.tokens[token] = time.time()
        return token
    
    def validate_token(self, token: str) -> bool:
        """Validate a CSRF token."""
        if not token or token not in self.tokens:
            return False
        
        # Check if token is expired
        if time.time() - self.tokens[token] > self.token_lifetime:
            del self.tokens[token]
            return False
        
        return True
    
    def cleanup_expired_tokens(self):
        """Remove expired tokens."""
        current_time = time.time()
        expired_tokens = [
            token for token, timestamp in self.tokens.items()
            if current_time - timestamp > self.token_lifetime
        ]
        for token in expired_tokens:
            del self.tokens[token]

class SecurityMiddleware(BaseHTTPMiddleware):
    """Comprehensive security middleware."""
    
    def __init__(self, app, is_development: bool = False):
        super().__init__(app)
        self.is_development = is_development
        self.csrf_protection = CSRFProtection()
        
        # Endpoints that require CSRF protection
        self.csrf_protected_endpoints = {
            "/admin/", "/api/orders", "/api/paypal/orders",
            "/api/coupons", "/users", "/products"
        }
        
        # Methods that require CSRF protection
        self.csrf_protected_methods = {"POST", "PUT", "DELETE", "PATCH"}
        
        logger.info(f"Security middleware initialized (development: {is_development})")
    
    def _requires_csrf_protection(self, request: Request) -> bool:
        """Check if request requires CSRF protection."""
        if request.method not in self.csrf_protected_methods:
            return False
        
        path = str(request.url.path)
        
        # Skip CSRF for authentication endpoints (handled by rate limiting)
        if any(auth_path in path for auth_path in ["/login", "/auth/", "/health"]):
            return False
        
        # Skip CSRF protection in development mode for coupon validation, PayPal, and admin operations
        if self.is_development and ("/api/coupons/validate" in path or "/api/paypal/orders" in path or "/admin/" in path or "/api/orders/" in path):
            return False
        
        # Check if any protected endpoint matches
        return any(protected in path for protected in self.csrf_protected_endpoints)
    
    def _add_security_headers(self, response: Response) -> None:
        """Add comprehensive security headers to response."""
        
        # Basic security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), "
            "payment=(self), usb=(), magnetometer=(), gyroscope=()"
        )
        
        # HSTS header for HTTPS (only in production)
        if not self.is_development:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Content Security Policy
        csp_policy = (
            SecurityHeaders.CSP_POLICY_DEV if self.is_development 
            else SecurityHeaders.CSP_POLICY
        )
        response.headers["Content-Security-Policy"] = csp_policy
        
        # Server header removal (security through obscurity)
        if "server" in response.headers:
            del response.headers["server"]
    
    def _validate_request_size(self, request: Request) -> None:
        """Validate request size to prevent DoS attacks."""
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                max_size = 10 * 1024 * 1024  # 10MB limit
                if size > max_size:
                    client_ip = request.client.host if request.client else "unknown"
                    log_security_event(
                        f"Request size limit exceeded: {size} bytes",
                        ip_address=client_ip,
                        endpoint=str(request.url.path),
                        event_type="request_size_exceeded"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Request entity too large"
                    )
            except ValueError:
                pass  # Invalid content-length header
    
    def _detect_suspicious_patterns(self, request: Request) -> None:
        """Detect suspicious request patterns."""
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        path = str(request.url.path)
        
        # Check for common attack patterns
        suspicious_patterns = [
            "admin", "wp-admin", "phpmyadmin", ".env", "config",
            "backup", "sql", "database", "../", "script>", "javascript:",
            "eval(", "base64", "union select", "drop table"
        ]
        
        # Check path and query parameters
        full_url = str(request.url)
        found_patterns = [pattern for pattern in suspicious_patterns if pattern in full_url.lower()]
        
        if found_patterns:
            log_security_event(
                f"Suspicious request patterns detected in URL: {', '.join(found_patterns)}",
                ip_address=client_ip,
                endpoint=path,
                user_agent=user_agent,
                event_type="suspicious_pattern",
                full_url=full_url
            )
        
        # Check for bot-like behavior
        bot_indicators = ["bot", "crawler", "spider", "scraper"]
        if any(indicator in user_agent.lower() for indicator in bot_indicators):
            if not any(legit in user_agent.lower() for legit in ["googlebot", "bingbot"]):
                log_security_event(
                    f"Potentially malicious bot detected",
                    ip_address=client_ip,
                    user_agent=user_agent,
                    event_type="suspicious_bot"
                )
    
    async def dispatch(self, request: Request, call_next) -> StarletteResponse:
        """Process request through security middleware."""
        
        # Validate request size
        try:
            self._validate_request_size(request)
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )
        
        # Detect suspicious patterns
        self._detect_suspicious_patterns(request)
        
        # CSRF Protection for sensitive endpoints
        if self._requires_csrf_protection(request):
            csrf_token = request.headers.get("X-CSRF-Token")
            if not csrf_token or not self.csrf_protection.validate_token(csrf_token):
                client_ip = request.client.host if request.client else "unknown"
                log_security_event(
                    "CSRF token validation failed",
                    ip_address=client_ip,
                    endpoint=str(request.url.path),
                    method=request.method,
                    event_type="csrf_validation_failed"
                )
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF token required or invalid"}
                )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers to response
        self._add_security_headers(response)
        
        # Cleanup expired CSRF tokens periodically
        if secrets.randbelow(100) == 0:  # 1% chance
            self.csrf_protection.cleanup_expired_tokens()
        
        return response

# Global CSRF protection instance for external access
csrf_protection = CSRFProtection()

# Endpoint to get CSRF token
def get_csrf_token() -> str:
    """Generate and return a new CSRF token."""
    return csrf_protection.generate_token()
