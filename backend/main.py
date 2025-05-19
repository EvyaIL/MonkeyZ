from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse
import uvicorn
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
import logging

from src.routers.users_router import users_router
from src.routers.products_router import product_router
from src.base_exception.base_exception import BaseException
from src.routers.keys_router import key_router
from src.models.contact.contact import ContactForm, ContactResponse
from src.mongodb.mongodb import MongoDb
from src.mongodb.contacts_collection import ContactCollection
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

app = FastAPI(
    title="MonkeyZ API",
    description="API backend for MonkeyZ - Premium products and services.",
    version="1.0.0",
    contact={
        "name": "MonkeyZ Support",
        "url": "https://monkeyz.co.il/contact",
        "email": "support@monkeyz.co.il",
    },
    openapi_tags=[
        {"name": "users", "description": "Operations with users"},
        {"name": "products", "description": "Manage products"},
        {"name": "keys", "description": "Key management"},
        {"name": "grow", "description": "Grow related endpoints"},
    ]
)

from src.routers import grow_router # Changed from 'from routers import grow_router'
app.include_router(grow_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://monkeyz.co.il"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["default"])
def health_check():
    return {"status": "ok"}
    
@app.get("/health/db", tags=["default"])
async def db_health_check():
    """Check the health of the MongoDB connection."""
    import os
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_uri = os.getenv("MONGODB_URI")
    if not mongo_uri:
        return {"status": "error", "message": "MONGODB_URI environment variable is not set."}
    
    try:
        # Try to connect with a short timeout
        client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Ping to verify connection
        await client.admin.command('ping')
        
        # Get server info to verify connection details
        server_info = await client.admin.command('serverStatus')
        
        details = {
            "version": server_info.get("version", "Unknown"),
            "uptime": server_info.get("uptime", 0),
            "connections": server_info.get("connections", {}).get("current", 0)
        }
        
        # Close the connection
        client.close()
        return {"status": "ok", "database": "connected", "details": details}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "message": str(e)}

app.include_router(users_router)
app.include_router(product_router)
app.include_router(key_router)

@app.exception_handler(BaseException)
async def custom_exception_handler(request: Request, exc: BaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.msg, "path": exc.path},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": str(exc)},
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
    try:
        await mongo.connection()
        mongo_client = await mongo.get_client()
        contact_collection = ContactCollection(mongo_client)
        logging.info("Application started successfully with database connection")
    except Exception as e:
        logging.error(f"Failed to initialize database connection during startup: {str(e)}")
        # We don't want to crash the app on startup, but we'll log the error
        # The error will be handled when specific endpoints are called

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