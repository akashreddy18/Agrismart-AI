from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """
        Query user record matching specific email address.
        """
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_phone_number(self, phone_number: str) -> Optional[User]:
        """
        Query user record matching specific phone number.
        """
        query = select(User).where(User.phone_number == phone_number)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
