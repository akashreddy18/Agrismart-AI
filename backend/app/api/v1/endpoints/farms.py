from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.repositories.farm_repo import FarmRepository
from app.schemas.farm import FarmCreate, FarmResponse, FarmUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[FarmResponse])
async def read_farms(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve all farms belonging to the authenticated farmer.
    """
    farm_repo = FarmRepository(db)
    farms = await farm_repo.get_multi_by_user(current_user.id, skip=skip, limit=limit)
    return farms

@router.post("/", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
async def create_farm(
    *,
    db: AsyncSession = Depends(get_db),
    farm_in: FarmCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Create a new farm segment for the authenticated farmer.
    """
    farm_repo = FarmRepository(db)
    farm_obj = Farm(
        user_id=current_user.id,
        name=farm_in.name,
        location_name=farm_in.location_name,
        latitude=farm_in.latitude,
        longitude=farm_in.longitude,
        acreage=farm_in.acreage,
        soil_type=farm_in.soil_type
    )
    return await farm_repo.create(farm_obj)

@router.get("/{id}", response_model=FarmResponse)
async def read_farm_by_id(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get detailed information of a specific farm by ID.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(id)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found."
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this farm."
        )
    return farm

@router.put("/{id}", response_model=FarmResponse)
async def update_farm(
    id: UUID,
    *,
    db: AsyncSession = Depends(get_db),
    farm_in: FarmUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update detailed configurations of a farm.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(id)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found."
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this farm."
        )
    return await farm_repo.update(farm, farm_in)

@router.delete("/{id}", response_model=FarmResponse)
async def delete_farm(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Remove a farm segment from records.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(id)
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found."
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this farm."
        )
    await farm_repo.remove(id)
    return farm
