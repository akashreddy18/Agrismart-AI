from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.logs import IrrigationHistory
from app.models.expense import Expense
from app.repositories.farm_repo import FarmRepository
from app.schemas.irrigation import IrrigationCreate, IrrigationResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/crop/{crop_id}", response_model=List[IrrigationResponse])
async def read_irrigation_history(
    crop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve irrigation history logs for a specific crop cycle.
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
            detail="Not enough permissions to access irrigation history for this crop."
        )
        
    query = select(IrrigationHistory).where(IrrigationHistory.crop_id == crop_id)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.post("/", response_model=IrrigationResponse, status_code=status.HTTP_201_CREATED)
async def create_irrigation_log(
    *,
    db: AsyncSession = Depends(get_db),
    log_in: IrrigationCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Log an irrigation application event and automatically register it as a crop expense.
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
            detail="Cannot log irrigation events for a farm that does not belong to you."
        )
        
    log_obj = IrrigationHistory(
        crop_id=log_in.crop_id,
        duration_minutes=log_in.duration_minutes,
        water_consumed_liters=log_in.water_consumed_liters,
        cost=log_in.cost,
        irrigation_date=log_in.irrigation_date
    )
    
    db.add(log_obj)
    await db.flush()
    await db.refresh(log_obj)
    
    # Auto log matching crop expense under IRRIGATION category if cost > 0
    if log_in.cost > 0:
        expense_obj = Expense(
            farm_id=crop.farm_id,
            crop_id=log_in.crop_id,
            category="IRRIGATION",
            amount=log_in.cost,
            description=f"Irrigation: {log_in.duration_minutes} mins ({log_in.water_consumed_liters or '—'} L)",
            transaction_date=log_in.irrigation_date
        )
        db.add(expense_obj)
        await db.flush()
        
    return log_obj

@router.delete("/{id}", response_model=IrrigationResponse)
async def delete_irrigation_log(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Remove an irrigation log from records.
    """
    log = await db.get(IrrigationHistory, id)
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
