from datetime import datetime
from beanie import PydanticObjectId
from src.models.sales.sales import Sale, SaleRequest
from src.models.key.key_exception import UpdateError
from src.singleton.singleton import Singleton
from .mongodb import MongoDb

class SalesCollection(MongoDb, metaclass=Singleton):
    """
    A class for interacting with the Sales collection, implemented as a Singleton.
    """

    async def initialize(self) -> None:
        """
        Initializes the Sales collection with the 'shop' database and Sale model.
        """
        database_name = "shop"
        self.db = await self.add_new_collection(database_name)
        await self.initialize_beanie(self.db, [Sale])

    async def total_revenue(self, start_date: datetime = None, end_date: datetime = None) -> int:
        """
        Calculates the total revenue within a specified date range.
        
        Args:
            start_date (datetime, optional): Start of the date range.
            end_date (datetime, optional): End of the date range.
        
        Returns:
            int: Total revenue in the given date range.
        """
        match_stage = {}
        if start_date and end_date:
            match_stage = {"created_at": {"$gte": start_date, "$lt": end_date}}

        total_revenue = await Sale.aggregate([
            {"$match": match_stage} if match_stage else {"$match": {}},
            {"$group": {"_id": None, "total_sales": {"$sum": "$total_price"}}}
        ]).to_list()

        return total_revenue[0]["total_sales"] if total_revenue else 0

    async def most_sold_products(self, start_date: datetime, end_date: datetime, limit: int = 1) -> list[dict]:
        """
        Finds the most sold products within a given date range.

        Adjusted for the current schema where 'products' is a dictionary mapping.
        It converts the dict to an array, unwinds it, and sums the 'count' for each product.

        Args:
            start_date (datetime): Start of the date range.
            end_date (datetime): End of the date range.
            limit (int): The number of top products to return.

        Returns:
            List[dict]: A list of the most sold products and their quantities.
        """
        result = await Sale.aggregate([
            {"$match": {"created_at": {"$gte": start_date, "$lt": end_date}}},
            {"$project": {"products_array": {"$objectToArray": "$products"}}},
            {"$unwind": "$products_array"},
            {"$group": {
                "_id": "$products_array.v.product_id",
                "total_sold": {"$sum": "$products_array.v.count"}
            }},
            {"$sort": {"total_sold": -1}},
            {"$limit": limit}
        ]).to_list()

        return result


    async def create_sale(self, sales_request: SaleRequest) -> PydanticObjectId:
        """
        Creates a new sale in the database.
        """
        sale = Sale(**sales_request.model_dump())
        await sale.save()
        return sale.id

    async def get_sale_by_id(self, sale_id: PydanticObjectId) -> Sale:
        """
        Retrieves a sale by its ID.
        """
        return await Sale.get(sale_id)

    async def delete_sale_by_id(self, sale_id: PydanticObjectId) -> None:
        """
        Deletes a sale by its ID if it exists.
        """
        sale = await self.get_sale_by_id(sale_id)
        if not sale:
            raise UpdateError("Sale not found")
        await sale.delete()
