from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.crop import Crop
from app.repositories.base import BaseRepository

class CropRepository(BaseRepository[Crop]):
    def __init__(self, db: AsyncSession):
        super().__init__(Crop, db)

    async def get_multi_by_farm(
        self, farm_id: UUID, *, skip: int = 0, limit: int = 100
    ) -> List[Crop]:
        """
        Retrieve crops registered for a specific farm segment.
        """
        query = select(Crop).where(Crop.farm_id == farm_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_active_crops_by_farm(self, farm_id: UUID) -> List[Crop]:
        """
        Retrieve all active (currently running/growing) crops for a farm.
        """
        query = select(Crop).where(
            (Crop.farm_id == farm_id) & (Crop.status == "ACTIVE")
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
