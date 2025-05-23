from pydantic import BaseModel
from typing import List
from datetime import datetime

class DailySale(BaseModel):
    date: str
    amount: float

class AdminAnalytics(BaseModel):
    totalSales: float = 0
    totalOrders: int = 0
    averageOrderValue: float = 0 
    dailySales: List[DailySale] = []
