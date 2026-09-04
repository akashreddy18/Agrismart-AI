from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.expense import Expense
from app.repositories.crop_repo import CropRepository
from app.repositories.farm_repo import FarmRepository
from app.schemas.crop import CropCreate, CropResponse, CropUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CropResponse])
async def read_crops(
    farm_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve all crops under a specific farm or across all farms owned by the user.
    """
    crop_repo = CropRepository(db)
    farm_repo = FarmRepository(db)
    
    if farm_id:
        # Check farm ownership
        farm = await farm_repo.get(farm_id)
        if not farm or farm.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access crops for this farm."
            )
        return await crop_repo.get_multi_by_farm(farm_id, skip=skip, limit=limit)
    else:
        # Get all farms of user, then fetch all crops associated
        user_farms = await farm_repo.get_multi_by_user(current_user.id, limit=200)
        farm_ids = [f.id for f in user_farms]
        if not farm_ids:
            return []
            
        query = select(Crop).where(Crop.farm_id.in_(farm_ids)).offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

@router.post("/", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
async def create_crop(
    *,
    db: AsyncSession = Depends(get_db),
    crop_in: CropCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Add a new crop lifecycle log under a farm.
    """
    farm_repo = FarmRepository(db)
    crop_repo = CropRepository(db)
    
    # Verify farm ownership
    farm = await farm_repo.get(crop_in.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot add crop to a farm that does not belong to you."
        )
        
    crop_obj = Crop(
        farm_id=crop_in.farm_id,
        name=crop_in.name,
        variety=crop_in.variety,
        sowing_date=crop_in.sowing_date,
        expected_harvest_date=crop_in.expected_harvest_date,
        stage=crop_in.stage,
        status=crop_in.status
    )
    return await crop_repo.create(crop_obj)

@router.get("/{id}", response_model=CropResponse)
async def read_crop_by_id(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get crop details by crop ID.
    """
    crop_repo = CropRepository(db)
    farm_repo = FarmRepository(db)
    
    crop = await crop_repo.get(id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found."
        )
        
    # Check parent farm ownership
    farm = await farm_repo.get(crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this crop."
        )
    return crop

@router.put("/{id}", response_model=CropResponse)
async def update_crop(
    id: UUID,
    *,
    db: AsyncSession = Depends(get_db),
    crop_in: CropUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update details (growth stage, expected harvest date) of a crop.
    """
    crop_repo = CropRepository(db)
    farm_repo = FarmRepository(db)
    
    crop = await crop_repo.get(id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found."
        )
        
    # Check parent farm ownership
    farm = await farm_repo.get(crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this crop."
        )
        
    return await crop_repo.update(crop, crop_in)

@router.delete("/{id}", response_model=CropResponse)
async def delete_crop(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a crop lifecycle log.
    """
    crop_repo = CropRepository(db)
    farm_repo = FarmRepository(db)
    
    crop = await crop_repo.get(id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found."
        )
        
    # Check parent farm ownership
    farm = await farm_repo.get(crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this crop."
        )
        
    # Permanently delete all associated crop expenses (including tractor & equipment expenses)
    await db.execute(delete(Expense).where(Expense.crop_id == id))
    await db.flush()
    await crop_repo.remove(id)
    return crop
