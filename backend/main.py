from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse
import uvicorn
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
import json
from starlette.requests import Request as StarletteRequest

from src.routers.users_router import users_router
from src.routers.products_router import product_router
from src.routers.admin_router import admin_router
from src.base_exception.base_exception import BaseException
from src.routers.keys_router import key_router, admin_key_router # Modified import
from src.routers.orders import router as orders_router
from src.models.contact.contact import ContactForm, ContactResponse
from src.mongodb.mongodb import MongoDb
from src.mongodb.contacts_collection import ContactCollection
from motor.motor_asyncio import AsyncIOMotorClient
from src.lib.mongo_json_encoder import MongoJSONEncoder
from bson.objectid import ObjectId

load_dotenv()

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
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", ",".join(DEFAULT_ALLOWED_ORIGINS)).split(",")

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
        {"name": "grow", "description": "Grow related endpoints"},
        {"name": "orders", "description": "Manage orders"},
    ]
)

from src.routers import grow_router # Changed from 'from routers import grow_router'
app.include_router(grow_router.router)

# Health check endpoint for DigitalOcean App Platform
@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Type", "Authorization"],
    max_age=600  # Cache preflight requests for 10 minutes (600 seconds)
)

@app.get("/health", tags=["default"])
def health_check():
    return {"status": "ok"}

app.include_router(users_router)
app.include_router(product_router)
app.include_router(key_router)
app.include_router(admin_router)  # Add admin router
app.include_router(admin_key_router) # Add admin_key_router
app.include_router(orders_router, prefix="/api", tags=["orders"])  # Add orders router

# Add coupon validation endpoint
@app.post("/api/coupons/validate")
async def validate_coupon(request: Request):
    from src.services.coupon_service import CouponService
    from src.mongodb.mongodb import MongoDb
    
    data = await request.json()
    code = data.get("code")
    amount = data.get("amount", 0)
    
    mongo_db = MongoDb()
    db = await mongo_db.get_db()
    coupon_service = CouponService(db)
    # Use validate_coupon (no usage increment) for validation endpoint
    discount, coupon, error = await coupon_service.validate_coupon(code, amount)
    
    if error:
        return JSONResponse({"discount": 0, "message": error}, status_code=400)
    return {"discount": discount, "message": "Coupon valid!", "coupon": coupon}

def get_cors_origin(request: StarletteRequest):
    origin = request.headers.get("origin")
    if origin and origin in ALLOWED_ORIGINS:
        return origin
    return ""

@app.exception_handler(BaseException)
async def custom_exception_handler(request: Request, exc: BaseException):
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
    origin = get_cors_origin(request)
    return JSONResponse(
        status_code=500,
        content={"message": str(exc)},
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
    global mongo_client, contact_collection
    mongo = MongoDb()
    await mongo.connection()
    mongo_client = await mongo.get_client()
    contact_collection = ContactCollection(mongo_client)

@app.post("/contact", response_model=ContactResponse)
async def handle_contact_form(contact_form: ContactForm):
    # Save the contact form to MongoDB
    contact_data = contact_form.dict()
    contact_id = await contact_collection.save_contact(contact_data)
    return ContactResponse(message=f"Message received successfully! ID: {contact_id}")

HOST = os.getenv('HOST', '127.0.0.1')
PORT = int(os.getenv('PORT', 8000))

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, log_level="info")