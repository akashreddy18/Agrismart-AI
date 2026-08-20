from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.expense import Expense
from app.repositories.farm_repo import FarmRepository
from app.repositories.expense_repo import ExpenseRepository
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.api.deps import get_current_user

router = APIRouter()

# Let's create an ExpenseRepository subclass in app.repositories.expense_repo if needed.
# Since we didn't write it, let's write it in this file or write it separately.
# Wait, let's write the repo in backend/app/repositories/expense_repo.py first to keep it fully clean!

@router.get("/", response_model=List[ExpenseResponse])
async def read_expenses(
    farm_id: Optional[UUID] = None,
    crop_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve list of expenses, optionally filtered by farm or crop.
    """
    farm_repo = FarmRepository(db)
    user_farms = await farm_repo.get_multi_by_user(current_user.id, limit=200)
    farm_ids = [f.id for f in user_farms]
    
    if not farm_ids:
        return []
        
    query = select(Expense).where(Expense.farm_id.in_(farm_ids))
    
    if farm_id:
        if farm_id not in farm_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access expenses for this farm."
            )
        query = query.where(Expense.farm_id == farm_id)
        
    if crop_id:
        query = query.where(Expense.crop_id == crop_id)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    *,
    db: AsyncSession = Depends(get_db),
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Record a new expense. Checks ownership of the target farm.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(expense_in.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot register expenses for a farm that does not belong to you."
        )
        
    expense_obj = Expense(
        farm_id=expense_in.farm_id,
        crop_id=expense_in.crop_id,
        category=expense_in.category,
        amount=expense_in.amount,
        description=expense_in.description,
        hours=expense_in.hours,
        rate_per_hour=expense_in.rate_per_hour,
        transaction_date=expense_in.transaction_date
    )
    
    db.add(expense_obj)
    await db.flush()
    await db.refresh(expense_obj)
    return expense_obj

@router.put("/{id}", response_model=ExpenseResponse)
async def update_expense(
    id: UUID,
    *,
    db: AsyncSession = Depends(get_db),
    expense_in: ExpenseUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update detailed values of an expense log.
    """
    farm_repo = FarmRepository(db)
    expense = await db.get(Expense, id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found."
        )
        
    # Check ownership
    farm = await farm_repo.get(expense.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this record."
        )
        
    update_data = expense_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(expense, field, update_data[field])
        
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return expense

@router.delete("/{id}", response_model=ExpenseResponse)
async def delete_expense(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Remove an expense log.
    """
    farm_repo = FarmRepository(db)
    expense = await db.get(Expense, id)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found."
        )
        
    # Check ownership
    farm = await farm_repo.get(expense.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this record."
        )
        
    await db.delete(expense)
    await db.flush()
    return expense
