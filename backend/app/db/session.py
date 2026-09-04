from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

import os

# Create async database engine
engine_options = {
    "echo": False,
    "future": True
}

database_url = settings.DATABASE_URL
if "sqlite" in database_url:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    canonical_db_file = os.path.join(backend_dir, "agrismart.db")
    database_url = f"sqlite+aiosqlite:///{canonical_db_file.replace(os.sep, '/')}"

if database_url.startswith("postgresql"):
    engine_options["pool_size"] = 20
    engine_options["max_overflow"] = 10

engine = create_async_engine(
    database_url,
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
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
