from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.farm import Farm
from app.repositories.base import BaseRepository

class FarmRepository(BaseRepository[Farm]):
    def __init__(self, db: AsyncSession):
        super().__init__(Farm, db)

    async def get_multi_by_user(
        self, user_id: UUID, *, skip: int = 0, limit: int = 100
    ) -> List[Farm]:
        """
        Retrieve all farm segments belonging to a specific user.
        """
        query = select(Farm).where(Farm.user_id == user_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
