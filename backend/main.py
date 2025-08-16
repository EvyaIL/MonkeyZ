from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, PlainTextResponse
import uvicorn
from dotenv import load_dotenv
import os
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import json
from starlette.requests import Request as StarletteRequest

from src.routers.users_router import users_router
from src.routers.products_router import product_router
from src.routers.admin_router import admin_router
from src.base_exception.base_exception import BaseException
from src.routers.keys_router import key_router, admin_key_router # Modified import
from src.routers.orders import router as orders_router
from src.routers.health_router import health_router
from src.routers.paypal_health import paypal_health_router
from src.routers.debug_router import debug_router
from src.models.contact.contact import ContactForm, ContactResponse
from src.mongodb.mongodb import MongoDb
from src.mongodb.contacts_collection import ContactCollection
from src.lib.email_service import send_contact_email, send_auto_reply_email  # Import email functions
from motor.motor_asyncio import AsyncIOMotorClient
from src.lib.mongo_json_encoder import MongoJSONEncoder
from bson.objectid import ObjectId
from src.middleware.rate_limiter import rate_limit_middleware
from src.middleware.security_middleware import SecurityMiddleware, get_csrf_token
from src.lib.logging_config import setup_logging, get_logger, error_tracker
from src.lib.database_manager import initialize_database, cleanup_database

load_dotenv()

# Initialize logging
setup_logging()
logger = get_logger(__name__)
logger.info("Starting MonkeyZ API application...")

# In development mode, allow all origins for easier testing
IS_DEV = os.getenv("ENVIRONMENT", "development").lower() == "development"

# Set CORS settings based on environment
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://www.monkeyz.co.il", 
    "https://monkeyz.co.il",
    "https://api.monkeyz.co.il",
    "https://monkeyz-frontend.ondigitalocean.app"
]
# Parse comma-separated list from env var if exists
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS")
if ALLOWED_ORIGINS_ENV:
    PARSED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",")]
else:
    PARSED_ORIGINS = DEFAULT_ALLOWED_ORIGINS

# Ensure localhost:3000 is always allowed, especially for development
if "http://localhost:3000" not in PARSED_ORIGINS:
    PARSED_ORIGINS.append("http://localhost:3000")

ALLOWED_ORIGINS = PARSED_ORIGINS # Define ALLOWED_ORIGINS here for global scope

app = FastAPI(
    title="MonkeyZ API",
    description="API backend for MonkeyZ - Premium products and services.",
    version="1.0.0",
    contact={
        "name": "MonkeyZ Support",
        "url": "https://monkeyz.co.il/contact",
        "email": "support@monkeyz.co.il",
    },    openapi_tags=[
        {"name": "users", "description": "Operations with users"},
        {"name": "products", "description": "Manage products"},
        {"name": "keys", "description": "Key management"},
        {"name": "orders", "description": "Manage orders"},
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS, # Use the processed list
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=600  # Cache preflight requests for 10 minutes (600 seconds)
)

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware)

# Add security middleware
IS_DEV = os.getenv("ENVIRONMENT", "development").lower() == "development"
app.add_middleware(SecurityMiddleware, is_development=IS_DEV)

# Health check endpoint for DigitalOcean App Platform
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}

@app.get("/health", tags=["default"])
def health_check():
    return {"status": "ok"}

app.include_router(users_router)
app.include_router(product_router)
app.include_router(key_router)
app.include_router(admin_router)  # Add admin router
app.include_router(admin_key_router) # Add admin_key_router
app.include_router(orders_router, prefix="/api", tags=["orders"])  # Add orders router
app.include_router(health_router, prefix="/api", tags=["health"])  # Add health router
app.include_router(paypal_health_router, prefix="/api", tags=["paypal"])  # Add PayPal health router
app.include_router(debug_router, prefix="/api", tags=["debug"])  # Add debug router for troubleshooting

# CSRF token endpoint
@app.get("/api/csrf-token", tags=["security"])
async def get_csrf_token_endpoint():
    """Get a CSRF token for protected operations."""
    token = get_csrf_token()
    return {"csrf_token": token}

# Note: Coupon validation is handled by the orders router at /api/coupons/validate
# This endpoint is public and doesn't require CSRF protection

def get_cors_origin(request: StarletteRequest):
    origin = request.headers.get("origin")
    if origin and origin in ALLOWED_ORIGINS:
        return origin
    return ""

@app.exception_handler(BaseException)
async def custom_exception_handler(request: Request, exc: BaseException):
    # Log the custom exception
    logger.error(
        f"Custom exception occurred: {exc.msg}",
        extra={
            "path": exc.path,
            "status_code": exc.status_code,
            "endpoint": str(request.url.path),
            "method": request.method
        }
    )
    
    origin = get_cors_origin(request)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.msg, "path": exc.path},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log the exception with error tracker
    error_tracker.capture_exception(
        exc,
        extra_data={
            "endpoint": str(request.url.path),
            "method": request.method,
            "user_agent": request.headers.get("user-agent"),
            "ip_address": request.client.host if request.client else "unknown"
        }
    )
    
    origin = get_cors_origin(request)
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint for MonkeyZ API.
    """
    return {"message": "Work"}

@app.get("/robots.txt", include_in_schema=False)
async def robots_txt():
    content = "User-agent: *\nDisallow:"
    return PlainTextResponse(content, media_type="text/plain")

@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap_xml():
    # You can generate this dynamically if you have many endpoints
    content = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://monkeyz.co.il/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
"""
    return PlainTextResponse(content, media_type="application/xml")

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    global mongo_client, contact_collection
    
    # Initialize optimized database connection
    logger.info("Starting application initialization...")
    
    success = await initialize_database()
    if not success:
        logger.error("Failed to initialize database connection")
        raise RuntimeError("Database initialization failed")
    
    # Initialize legacy collections for backward compatibility
    mongo = MongoDb()
    await mongo.connection()
    mongo_client = await mongo.get_client()
    contact_collection = ContactCollection(mongo_client)
    
    logger.info("Application initialization completed successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    logger.info("Starting application shutdown...")
    await cleanup_database()
    logger.info("Application shutdown completed")

@app.post("/contact", response_model=ContactResponse)
async def handle_contact_form(contact_form: ContactForm):
    try:
        # Save the contact form to MongoDB
        contact_data = contact_form.dict()
        contact_data["timestamp"] = datetime.now()
        contact_id = await contact_collection.save_contact(contact_data)
        
        # Send email notification to admin (you)
        admin_email = os.getenv("ADMIN_EMAIL", "support@monkeyz.co.il")  # Set your admin email in .env
        email_sent_to_admin = send_contact_email(
            to_email=admin_email,
            name=contact_form.name,
            message=f"Email: {contact_form.email}\nMessage: {contact_form.message}"
        )
        
        # Send auto-reply to customer
        auto_reply_sent = send_auto_reply_email(
            to_email=contact_form.email,
            subject="Thank you for contacting MonkeyZ!",
            message=f"Hello {contact_form.name},\n\nThank you for reaching out to us! We have received your message and will get back to you soon.\n\nYour message:\n{contact_form.message}\n\nBest regards,\nMonkeyZ Team"
        )
        
        # Log email sending status
        if email_sent_to_admin:
            logger.info(f"Contact form notification sent to admin for contact ID: {contact_id}")
        else:
            logger.error(f"Failed to send contact form notification to admin for contact ID: {contact_id}")
        
        if auto_reply_sent:
            logger.info(f"Auto-reply sent to {contact_form.email} for contact ID: {contact_id}")
        else:
            logger.error(f"Failed to send auto-reply to {contact_form.email} for contact ID: {contact_id}")
        
        return ContactResponse(
            message=f"Message received successfully! We'll get back to you soon. ID: {contact_id}"
        )
        
    except Exception as e:
        logger.error(f"Error handling contact form: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error processing your message. Please try again later."
        )

HOST = os.getenv('HOST', '127.0.0.1')
PORT = int(os.getenv('PORT', 8000))

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, log_level="info")