from typing import Any, Generic, List, Optional, Type, TypeVar, Union, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.base_class import Base

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        """
        Generic Repository constructor with model type and active async session.
        """
        self.model = model
        self.db = db

    async def get(self, id: Any) -> Optional[ModelType]:
        """
        Retrieve record by unique identifier.
        """
        return await self.db.get(self.model, id)

    async def get_multi(
        self, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """
        Retrieve list of records with offset and limit parameters.
        """
        query = select(self.model).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, obj_in: ModelType) -> ModelType:
        """
        Persist a new entity instance in database.
        """
        self.db.add(obj_in)
        await self.db.commit()
        await self.db.refresh(obj_in)
        return obj_in

    async def update(
        self, db_obj: ModelType, update_data: Union[Dict[str, Any], Any]
    ) -> ModelType:
        """
        Apply partial field updates on a retrieved record.
        """
        if isinstance(update_data, dict):
            data = update_data
        else:
            # Handle Pydantic schema objects or SQLAlchemy models
            data = update_data.__dict__ if hasattr(update_data, "__dict__") else {}

        for field in data:
            if hasattr(db_obj, field) and data[field] is not None:
                setattr(db_obj, field, data[field])

        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def remove(self, id: Any) -> Optional[ModelType]:
        """
        Remove record from storage by identifier.
        """
        obj = await self.db.get(self.model, id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
        return obj
