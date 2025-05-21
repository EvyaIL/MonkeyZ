# grow_router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import httpx
import os
import hmac
import hashlib

router = APIRouter(prefix="/payments", tags=["Payments"])

GROW_API_URL = "https://sandbox.meshulam.co.il/api/light/server/1.0/createPaymentProcess"
GROW_API_KEY = os.getenv("GROW_API_KEY")
GROW_WEBHOOK_SECRET = os.getenv("GROW_WEBHOOK_SECRET")
GROW_USER_ID = os.getenv("GROW_USER_ID", "d3e2efab83ef581a")  # Test account
GROW_PAGE_CODE = os.getenv("GROW_PAGE_CODE", "bc6203286633")  # Test wallet page code

class PaymentRequest(BaseModel):
    sum: float
    description: str
    customer_name: str
    email: str
    phone: str
    order_id: Optional[str] = None

class PaymentCallback(BaseModel):
    transactionId: str = Field(..., alias="transaction_id")
    paymentSum: float = Field(..., alias="payment_sum")
    paymentCurrency: str = Field(..., alias="payment_currency")
    paymentMethod: str = Field(..., alias="payment_method")
    numberOfPayments: int = Field(..., alias="number_of_payments")
    status: str
    orderId: Optional[str] = Field(None, alias="order_id")
    signature: str

def verify_webhook_signature(payload: dict, signature: str) -> bool:
    if not GROW_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    # Create signature
    payload_str = "&".join([f"{k}={v}" for k, v in sorted(payload.items()) if k != "signature"])
    expected_signature = hmac.new(
        GROW_WEBHOOK_SECRET.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@router.post("/create")
async def create_payment(data: PaymentRequest):
    if not GROW_API_KEY:
        raise HTTPException(status_code=500, detail="Grow API key not configured")

    payload = {
        "userId": GROW_USER_ID,
        "pageCode": GROW_PAGE_CODE,
        "sum": data.sum,
        "description": data.description,
        "fullName": data.customer_name,
        "email": data.email,
        "phone": data.phone,
        "successUrl": "https://monkeyz.co.il/payment-success",
        "failUrl": "https://monkeyz.co.il/payment-failed",
        "cancelUrl": "https://monkeyz.co.il/payment-cancelled",
        "notifyUrl": "https://monkeyz.co.il/api/payments/webhook",
        "language": "he",
        "currency": 1  # 1 = NIS
    }
    
    if data.order_id:
        payload["OrderId"] = data.order_id

    async with httpx.AsyncClient() as client:
        response = await client.post(GROW_API_URL, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Payment initialization failed")

    return response.json()

@router.post("/webhook")
async def payment_webhook(callback: PaymentCallback):
    # Remove signature from the dict to verify
    payload_dict = callback.dict(by_alias=True)
    signature = payload_dict.pop("signature")
    
    if not verify_webhook_signature(payload_dict, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different payment statuses
    if callback.status == "SUCCESS":
        # TODO: Update order status in your database
        # TODO: Send confirmation email to customer
        pass
    elif callback.status == "FAILED":
        # TODO: Handle failed payment
        pass
    elif callback.status == "CANCELLED":
        # TODO: Handle cancelled payment
        pass
    
    return {"status": "ok"}
