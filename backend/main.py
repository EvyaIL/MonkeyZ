from fastapi import FastAPI,Request 
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

from src.routers.users_router import users_router
from src.routers.products_router import product_router
from src.base_exception.base_exception import BaseException
from src.routers.keys_router import key_router
from src.routers.sales_router import sales_router
from src.routers.image_router import image_router


load_dotenv()
app = FastAPI()



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(users_router)
app.include_router(product_router)
app.include_router(key_router)
app.include_router(sales_router)
app.include_router(image_router)

@app.exception_handler(BaseException)
async def custom_exception_handler(request: Request, exc: BaseException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.msg,"path": exc.path},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": str(exc)},
    )


@app.get("/")
async def root():
    return {"message":"Work"}

HOST = str(os.getenv('HOST'))
PORT = int(os.getenv('PORT'))

if __name__== "__main__":
    uvicorn.run("main:app", host=HOST,port= PORT,log_level="info")


