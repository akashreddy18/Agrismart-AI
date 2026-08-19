from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.expense import Expense
from app.repositories.base import BaseRepository

class ExpenseRepository(BaseRepository[Expense]):
    def __init__(self, db: AsyncSession):
        super().__init__(Expense, db)

    async def get_multi_by_farm(
        self, farm_id: UUID, *, skip: int = 0, limit: int = 100
    ) -> List[Expense]:
        """
        Query expenses incurred by a single farm.
        """
        query = select(Expense).where(Expense.farm_id == farm_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_multi_by_crop(
        self, crop_id: UUID, *, skip: int = 0, limit: int = 100
    ) -> List[Expense]:
        """
        Query expenses specifically linked to a single crop cycle.
        """
        query = select(Expense).where(Expense.crop_id == crop_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
