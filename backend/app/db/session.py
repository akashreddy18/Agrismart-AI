from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Create async database engine
engine_options = {
    "echo": False,
    "future": True
}

if settings.DATABASE_URL.startswith("postgresql"):
    engine_options["pool_size"] = 20
    engine_options["max_overflow"] = 10

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_options
)

# Async session maker
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Dependency generator to retrieve async DB session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
