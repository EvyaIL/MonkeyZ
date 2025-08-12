"""
Structured logging configuration for MonkeyZ application.
Provides centralized logging with proper formatting, rotation, and error tracking.
"""

import logging
import logging.handlers
import os
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

class StructuredFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs."""
    
    def format(self, record: logging.LogRecord) -> str:
        # Base log entry
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry['ip_address'] = record.ip_address
        if hasattr(record, 'endpoint'):
            log_entry['endpoint'] = record.endpoint
        if hasattr(record, 'method'):
            log_entry['method'] = record.method
        if hasattr(record, 'duration'):
            log_entry['duration_ms'] = record.duration
        if hasattr(record, 'status_code'):
            log_entry['status_code'] = record.status_code
            
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info)
            }
            
        return json.dumps(log_entry)

class RequestLogger:
    """Helper class for logging HTTP requests."""
    
    @staticmethod
    def log_request(
        logger: logging.Logger,
        method: str,
        path: str,
        ip_address: str,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        duration: Optional[float] = None,
        status_code: Optional[int] = None,
        level: int = logging.INFO
    ):
        """Log an HTTP request with structured data."""
        extra = {
            'method': method,
            'endpoint': path,
            'ip_address': ip_address,
        }
        
        if user_id:
            extra['user_id'] = user_id
        if request_id:
            extra['request_id'] = request_id
        if duration:
            extra['duration'] = duration
        if status_code:
            extra['status_code'] = status_code
            
        message = f"{method} {path}"
        if status_code:
            message += f" - {status_code}"
        if duration:
            message += f" ({duration:.2f}ms)"
            
        logger.log(level, message, extra=extra)

def setup_logging():
    """Configure structured logging for the application."""
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Get log level from environment
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create formatters
    structured_formatter = StructuredFormatter()
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Console handler (for development)
    if os.getenv("ENVIRONMENT", "development").lower() == "development":
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.DEBUG)
        root_logger.addHandler(console_handler)
    
    # File handler for all logs
    file_handler = logging.handlers.RotatingFileHandler(
        log_dir / "monkeyz.log",
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=10
    )
    file_handler.setFormatter(structured_formatter)
    file_handler.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / "monkeyz_errors.log",
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=10
    )
    error_handler.setFormatter(structured_formatter)
    error_handler.setLevel(logging.ERROR)
    root_logger.addHandler(error_handler)
    
    # Security events handler
    security_handler = logging.handlers.RotatingFileHandler(
        log_dir / "security.log",
        maxBytes=50 * 1024 * 1024,  # 50MB
        backupCount=20
    )
    security_handler.setFormatter(structured_formatter)
    
    # Create security logger
    security_logger = logging.getLogger("security")
    security_logger.addHandler(security_handler)
    security_logger.setLevel(logging.WARNING)
    
    # Disable propagation to avoid duplicate logs
    security_logger.propagate = False
    
    logging.info("Logging configured successfully")

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(name)

def get_security_logger() -> logging.Logger:
    """Get the security logger instance."""
    return logging.getLogger("security")

# Error tracking functions
class ErrorTracker:
    """Simple error tracking system."""
    
    def __init__(self):
        self.logger = get_logger("error_tracker")
        
    def capture_exception(
        self,
        exception: Exception,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ):
        """Capture and log an exception with context."""
        extra = {}
        
        if user_id:
            extra['user_id'] = user_id
        if request_id:
            extra['request_id'] = request_id
        if extra_data:
            extra.update(extra_data)
            
        self.logger.error(
            f"Exception occurred: {type(exception).__name__}: {str(exception)}",
            exc_info=True,
            extra=extra
        )
        
    def capture_message(
        self,
        message: str,
        level: str = "error",
        user_id: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ):
        """Capture a custom message."""
        extra = {}
        
        if user_id:
            extra['user_id'] = user_id
        if extra_data:
            extra.update(extra_data)
            
        log_level = getattr(logging, level.upper(), logging.ERROR)
        self.logger.log(log_level, message, extra=extra)

# Global error tracker instance
error_tracker = ErrorTracker()

# Convenience functions
def log_security_event(message: str, **kwargs):
    """Log a security event."""
    security_logger = get_security_logger()
    security_logger.warning(message, extra=kwargs)

def log_authentication_failure(ip_address: str, username: str, reason: str):
    """Log authentication failure."""
    log_security_event(
        f"Authentication failure for user '{username}': {reason}",
        ip_address=ip_address,
        username=username,
        event_type="auth_failure"
    )

def log_rate_limit_exceeded(ip_address: str, endpoint: str):
    """Log rate limit exceeded."""
    log_security_event(
        f"Rate limit exceeded for IP {ip_address} on endpoint {endpoint}",
        ip_address=ip_address,
        endpoint=endpoint,
        event_type="rate_limit_exceeded"
    )

def log_suspicious_activity(ip_address: str, activity: str, **kwargs):
    """Log suspicious activity."""
    log_security_event(
        f"Suspicious activity from IP {ip_address}: {activity}",
        ip_address=ip_address,
        activity=activity,
        event_type="suspicious_activity",
        **kwargs
    )
