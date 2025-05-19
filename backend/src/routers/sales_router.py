import contextlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from src.lib.token_handler import get_current_user
from src.deps.deps import get_sales_controller_dependency
from src.models.user.user import User
from src.controller.sales_controller import SalesController

@contextlib.asynccontextmanager
async def lifespan(router: APIRouter):
    """Initializes the Sales Controller for API routes."""
    sales_controller: SalesController = get_sales_controller_dependency()
    await sales_controller.initialize()
    yield
    await sales_controller.disconnect()

sales_router = APIRouter(prefix="/sales", tags=["sales"], lifespan=lifespan)

@sales_router.get("/revenue")
async def get_revenue(start_date: datetime = None, end_date: datetime = None, sales_controller: SalesController = Depends(get_sales_controller_dependency), current_user: User = Depends(get_current_user)):
    return await sales_controller.total_revenue(start_date, end_date, current_user.username)

@sales_router.get("/most_sold")
async def most_sold(start_date: datetime = None, end_date: datetime = None, limit:int = 0 ,sales_controller: SalesController = Depends(get_sales_controller_dependency), current_user: User = Depends(get_current_user)):
    return await sales_controller.most_sold_products(start_date, end_date, limit, current_user.username)

@sales_router.get("/statistics")
async def get_statistics(
    sales_controller: SalesController = Depends(get_sales_controller_dependency),
    current_user: User = Depends(get_current_user),
):
    """Fetches revenue and most sold products for all time, current week, and month."""
    today = datetime.utcnow()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    revenue_all_time = await sales_controller.total_revenue(username=current_user.username)
    revenue_week = await sales_controller.total_revenue(start_of_week, today, username=current_user.username)
    revenue_month = await sales_controller.total_revenue(start_of_month, today, username=current_user.username)

    most_sold_all_time = await sales_controller.most_sold_products(limit=3, username=current_user.username)
    most_sold_week = await sales_controller.most_sold_products(start_of_week, today, 3, username=current_user.username)
    most_sold_month = await sales_controller.most_sold_products(start_of_month, today, 3, username=current_user.username)

    return {
        "revenue": {
            "all_time": revenue_all_time,
            "week": revenue_week,
            "month": revenue_month,
        },
        "most_sold": {
            "all_time": most_sold_all_time,
            "week": most_sold_week,
            "month": most_sold_month,
        },
    }


