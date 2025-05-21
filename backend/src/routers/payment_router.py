from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import httpx
from ..deps.deps import get_settings
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/api/payment", tags=["payment"])
logger = logging.getLogger(__name__)

class PaymentCallback(BaseModel):
    err: str
    status: str
    data: Dict[str, Any]

class PaymentApproval(BaseModel):
    pageCode: str
    apiKey: str
    transactionId: int
    transactionToken: str
    transactionTypeId: int
    paymentType: int
    sum: int
    firstPaymentSum: int
    periodicalPaymentSum: int
    paymentsNum: int
    allPaymentsNum: int
    paymentDate: str
    asmachta: int
    description: str
    fullName: str
    payerPhone: str
    payerEmail: str
    cardSuffix: str
    cardType: str
    cardTypeCode: int
    cardBrand: str
    cardBrandCode: int
    cardExp: str
    processId: int
    processToken: str

@router.post("/webhook")
async def payment_webhook(callback: PaymentCallback, settings = Depends(get_settings)):
    """Handle incoming payment webhooks from Grow"""
    try:
        logger.info(f"Received payment webhook: {callback}")
        
        if callback.status == "1" and callback.data:
            # Prepare approval data
            approval_data = PaymentApproval(
                pageCode=settings.GROW_PAGE_CODE,
                apiKey=settings.GROW_API_KEY,
                **callback.data
            )

            # Send approval to Grow
            async with httpx.AsyncClient() as client:
                approval_url = "https://sandbox.meshulam.co.il/api/light/server/1.0/approveTransaction" \
                    if settings.ENV != "production" else \
                    "https://meshulam.co.il/api/light/server/1.0/approveTransaction"
                
                response = await client.post(
                    approval_url,
                    data=approval_data.dict(),
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    logger.info(f"Successfully approved transaction {callback.data.get('transactionId')}")
                    return {"status": "success"}
                else:
                    logger.error(f"Failed to approve transaction: {response.text}")
                    return {"status": "error", "message": "Failed to approve transaction"}
        
        return {"status": "ignored", "message": "Non-success status received"}
    
    except Exception as e:
        logger.error(f"Error processing payment webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
