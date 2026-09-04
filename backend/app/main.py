from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events processor. Performs table creation on startup
    and engine disposal on teardown.
    """
    # Create database schemas on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def check_and_add_columns(connection):
            from sqlalchemy import inspect, text
            inspector = inspect(connection)
            columns = [c['name'] for c in inspector.get_columns('expense')]
            if 'equipment_name' not in columns:
                connection.execute(text("ALTER TABLE expense ADD COLUMN equipment_name VARCHAR(100)"))

        await conn.run_sync(check_and_add_columns)
    
    yield
    
    # Dispose pool connections on shutdown
    await engine.dispose()

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Cross-Origin Resource Sharing (CORS) setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure explicit origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Include main api routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount uploads static files directory for crop disease images
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.get("/", tags=["health"])
def root():
    """
    Health check root route.
    """
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs"
    }
