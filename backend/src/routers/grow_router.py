# grow_router.py

from fastapi import APIRouter, Request
from pydantic import BaseModel
import httpx
import os

router = APIRouter(prefix="/payments", tags=["Payments"])

GROW_API_URL = "https://secure.grow-il.com/api/light/execute"  # Replace with the real endpoint
GROW_API_KEY = os.getenv("GROW_API_KEY")  # Put your Grow API Key in .env

class PaymentRequest(BaseModel):
    sum: float
    description: str
    customer_name: str
    email: str

@router.post("/create")
async def create_payment(data: PaymentRequest):
    payload = {
        "ApiKey": GROW_API_KEY,
        "Sum": data.sum,
        "Description": data.description,
        "FullName": data.customer_name,
        "Email": data.email,
        "SuccessRedirectUrl": "https://monkeyz.co.il/success",
        "ErrorRedirectUrl": "https://monkeyz.co.il/error"
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(GROW_API_URL, json=payload)

    if response.status_code != 200:
        return {"error": "Payment failed", "details": response.text}

    return response.json()
