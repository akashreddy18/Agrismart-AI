from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.expense import Expense
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.sales import Sales

class FinanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_crop_financial_summary(self, crop_id: UUID) -> dict:
        """
        Compute financial statement for a crop cycle:
        - Total investment
        - Cost per acre
        - Cost per kilogram
        - Net profit/loss & ROI
        """
        # Fetch crop
        crop = await self.db.get(Crop, crop_id)
        if not crop:
            return {"error": "Crop not found"}
            
        # Fetch parent farm to get acreage
        farm = await self.db.get(Farm, crop.farm_id)
        acreage = float(farm.acreage) if farm else 1.0

        # Calculate total expenses (Investment)
        expense_query = select(func.sum(Expense.amount)).where(Expense.crop_id == crop_id)
        expense_res = await self.db.execute(expense_query)
        total_investment = float(expense_res.scalar() or 0.0)

        # Calculate cost per acre
        cost_per_acre = total_investment / acreage if acreage > 0 else 0.0

        # Fetch sales quantity and total revenue
        sales_query = select(
            func.sum(Sales.quantity_kg),
            func.sum(Sales.total_income)
        ).where(Sales.crop_id == crop_id)
        sales_res = await self.db.execute(sales_query)
        sales_data = sales_res.first()
        
        total_quantity_kg = float(sales_data[0] or 0.0) if sales_data else 0.0
        total_revenue = float(sales_data[1] or 0.0) if sales_data else 0.0

        # Calculate cost per kg
        cost_per_kg = total_investment / total_quantity_kg if total_quantity_kg > 0 else 0.0

        # Profit & ROI
        net_profit = total_revenue - total_investment
        roi = (net_profit / total_investment * 100) if total_investment > 0 else 0.0

        return {
            "crop_id": str(crop_id),
            "crop_name": crop.name,
            "farm_name": farm.name if farm else "N/A",
            "acreage": acreage,
            "total_investment": round(total_investment, 2),
            "cost_per_acre": round(cost_per_acre, 2),
            "total_quantity_kg": round(total_quantity_kg, 2),
            "cost_per_kg": round(cost_per_kg, 2),
            "total_revenue": round(total_revenue, 2),
            "net_profit": round(net_profit, 2),
            "roi": round(roi, 2)
        }
