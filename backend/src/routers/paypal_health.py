# PayPal Health Check Endpoint for Production Monitoring
from fastapi import APIRouter, HTTPException
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Create a new router for PayPal health checks
paypal_health_router = APIRouter()

@paypal_health_router.get("/paypal/health")
async def paypal_health_check():
    """
    Health check endpoint for PayPal configuration
    Returns PayPal configuration status and connectivity
    """
    try:
        paypal_mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
        
        # Check if required environment variables are set
        if paypal_mode == "live":
            client_id = os.getenv("PAYPAL_LIVE_CLIENT_ID")
            client_secret = os.getenv("PAYPAL_LIVE_CLIENT_SECRET")
        else:
            client_id = os.getenv("PAYPAL_CLIENT_ID")
            client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
        
        # Validate configuration
        config_status = {
            "mode": paypal_mode,
            "client_id_configured": bool(client_id),
            "client_secret_configured": bool(client_secret),
            "environment": os.getenv("ENVIRONMENT", "development")
        }
        
        # Check for production readiness
        production_ready = True
        issues = []
        
        if not client_id:
            production_ready = False
            issues.append(f"PayPal client ID not configured for {paypal_mode} mode")
            
        if not client_secret:
            production_ready = False
            issues.append(f"PayPal client secret not configured for {paypal_mode} mode")
            
        # Production-specific checks
        if os.getenv("ENVIRONMENT") == "production":
            if paypal_mode != "live":
                production_ready = False
                issues.append("PayPal is not in live mode for production environment")
                
            if client_id and "sandbox" in client_id.lower():
                production_ready = False
                issues.append("Using sandbox credentials in production")
        
        return {
            "status": "healthy" if production_ready else "configuration_issues",
            "paypal_config": config_status,
            "production_ready": production_ready,
            "issues": issues,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"PayPal health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"PayPal health check failed: {str(e)}"
        )

@paypal_health_router.get("/paypal/config")
async def get_paypal_config():
    """
    Get current PayPal configuration (without sensitive data)
    """
    try:
        paypal_mode = os.getenv("PAYPAL_MODE", "sandbox").lower()
        
        if paypal_mode == "live":
            client_id = os.getenv("PAYPAL_LIVE_CLIENT_ID")
        else:
            client_id = os.getenv("PAYPAL_CLIENT_ID")
            
        return {
            "mode": paypal_mode,
            "client_id_preview": client_id[:10] + "..." if client_id else None,
            "environment": os.getenv("ENVIRONMENT", "development"),
            "is_production_ready": paypal_mode == "live" and bool(client_id),
            "recommended_currency": "USD" if paypal_mode == "sandbox" else "ILS"
        }
        
    except Exception as e:
        logger.error(f"Failed to get PayPal config: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get PayPal config: {str(e)}"
        )

@paypal_health_router.post("/paypal/debug")
async def debug_paypal_order():
    """
    Debug PayPal order creation issues
    Creates a test order to verify configuration
    """
    try:
        from ..lib.paypal_debug import debug_paypal_configuration, create_paypal_test_order
        
        # Run configuration debug
        config_debug = debug_paypal_configuration()
        
        # Create test order
        test_result = create_paypal_test_order()
        
        return {
            "configuration": config_debug,
            "test_order": test_result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"PayPal debug failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"PayPal debug failed: {str(e)}"
        )
