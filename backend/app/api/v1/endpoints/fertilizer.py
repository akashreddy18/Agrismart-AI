from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.logs import FertilizerHistory
from app.models.expense import Expense
from app.repositories.farm_repo import FarmRepository
from app.schemas.fertilizer import FertilizerCreate, FertilizerResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/crop/{crop_id}", response_model=List[FertilizerResponse])
async def read_fertilizer_history(
    crop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve fertilizer application logs for a specific crop cycle.
    """
    crop = await db.get(Crop, crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop record not found."
        )
        
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access logs for this crop."
        )
        
    query = select(FertilizerHistory).where(FertilizerHistory.crop_id == crop_id)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.post("/", response_model=FertilizerResponse, status_code=status.HTTP_201_CREATED)
async def create_fertilizer_log(
    *,
    db: AsyncSession = Depends(get_db),
    log_in: FertilizerCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Log a fertilizer application event and automatically register it as a crop expense.
    """
    crop = await db.get(Crop, log_in.crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop record not found."
        )
        
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot log actions for a farm that does not belong to you."
        )
        
    log_obj = FertilizerHistory(
        crop_id=log_in.crop_id,
        fertilizer_name=log_in.fertilizer_name,
        quantity_kg=log_in.quantity_kg,
        cost=log_in.cost,
        application_date=log_in.application_date
    )
    
    db.add(log_obj)
    await db.flush()
    await db.refresh(log_obj)
    
    # Auto log matching crop expense if cost > 0
    if log_in.cost > 0:
        expense_obj = Expense(
            farm_id=crop.farm_id,
            crop_id=log_in.crop_id,
            category="FERTILIZERS",
            amount=log_in.cost,
            description=f"Fertilizer: {log_in.fertilizer_name} ({log_in.quantity_kg} kg)",
            transaction_date=log_in.application_date
        )
        db.add(expense_obj)
        await db.flush()
        
    return log_obj

@router.delete("/{id}", response_model=FertilizerResponse)
async def delete_fertilizer_log(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Remove a fertilizer log.
    """
    log = await db.get(FertilizerHistory, id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log record not found."
        )
        
    crop = await db.get(Crop, log.crop_id)
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this record."
        )
        
    await db.delete(log)
    await db.flush()
    return log
export_router = router  # alias or router direct
