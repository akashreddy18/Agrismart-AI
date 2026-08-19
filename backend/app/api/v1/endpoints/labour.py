from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.labour import Labour
from app.models.expense import Expense
from app.repositories.farm_repo import FarmRepository
from app.schemas.labour import LabourCreate, LabourResponse, LabourUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[LabourResponse])
async def read_labours(
    farm_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve all labour records for the authenticated farmer's farms.
    """
    farm_repo = FarmRepository(db)
    user_farms = await farm_repo.get_multi_by_user(current_user.id, limit=200)
    farm_ids = [f.id for f in user_farms]
    
    if not farm_ids:
        return []
        
    query = select(Labour).where(Labour.farm_id.in_(farm_ids))
    
    if farm_id:
        if farm_id not in farm_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access labour records for this farm."
            )
        query = query.where(Labour.farm_id == farm_id)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.post("/", response_model=LabourResponse, status_code=status.HTTP_201_CREATED)
async def create_labour(
    *,
    db: AsyncSession = Depends(get_db),
    labour_in: LabourCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Record labour wages and automatically log a matching crop expense if a crop is linked.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(labour_in.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot record labour for a farm that does not belong to you."
        )
        
    total_cost = labour_in.days_worked * labour_in.daily_wage
    
    labour_obj = Labour(
        farm_id=labour_in.farm_id,
        worker_name=labour_in.worker_name,
        work_type=labour_in.work_type,
        days_worked=labour_in.days_worked,
        daily_wage=labour_in.daily_wage,
        total_cost=total_cost,
        recorded_date=labour_in.recorded_date
    )
    
    db.add(labour_obj)
    await db.flush()
    await db.refresh(labour_obj)
    
    # If crop_id is provided, automatically log this as a LABOUR expense under the crop!
    if labour_in.crop_id:
        crop = await db.get(Crop, labour_in.crop_id)
        if crop and crop.farm_id == labour_in.farm_id:
            expense_obj = Expense(
                farm_id=labour_in.farm_id,
                crop_id=labour_in.crop_id,
                category="LABOUR",
                amount=total_cost,
                description=f"Wages: {labour_in.worker_name} ({labour_in.work_type} for {labour_in.days_worked} days)",
                transaction_date=labour_in.recorded_date
            )
            db.add(expense_obj)
            await db.flush()
            
    return labour_obj

@router.put("/{id}", response_model=LabourResponse)
async def update_labour(
    id: UUID,
    *,
    db: AsyncSession = Depends(get_db),
    labour_in: LabourUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update labour wage parameters. Recalculates total cost.
    """
    farm_repo = FarmRepository(db)
    labour = await db.get(Labour, id)
    if not labour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Labour record not found."
        )
        
    farm = await farm_repo.get(labour.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this record."
        )
        
    update_data = labour_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(labour, field, update_data[field])
        
    # Recalculate total cost
    labour.total_cost = labour.days_worked * labour.daily_wage
    
    db.add(labour)
    await db.flush()
    await db.refresh(labour)
    return labour

@router.delete("/{id}", response_model=LabourResponse)
async def delete_labour(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a labour record.
    """
    farm_repo = FarmRepository(db)
    labour = await db.get(Labour, id)
    if not labour:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Labour record not found."
        )
        
    farm = await farm_repo.get(labour.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this record."
        )
        
    await db.delete(labour)
    await db.flush()
    return labour
