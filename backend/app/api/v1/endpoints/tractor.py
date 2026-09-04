from datetime import date
from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.expense import Expense
from app.models.logs import TractorConfig
from app.repositories.farm_repo import FarmRepository
from app.schemas.tractor import TractorConfigCreate, TractorConfigResponse, TractorCalculationRequest
from app.schemas.expense import ExpenseResponse
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/config/{farm_id}", response_model=TractorConfigResponse)
async def get_tractor_config(
    farm_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve tractor operational configuration parameters for a farm.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access configurations for this farm."
        )
        
    query = select(TractorConfig).where(TractorConfig.farm_id == farm_id)
    result = await db.execute(query)
    config = result.scalar_one_or_none()
    
    if not config:
        # Create a blank default configuration on-the-fly for the user
        config = TractorConfig(
            farm_id=farm_id,
            diesel_price=0.0,
            mileage_liters_per_hour=0.0,
            driver_charge_per_hour=0.0,
            maintenance_cost_per_hour=0.0,
            calculated_cost_per_hour=0.0
        )
        db.add(config)
        await db.flush()
        await db.refresh(config)
        
    return config

@router.post("/config", response_model=TractorConfigResponse)
async def save_tractor_config(
    *,
    db: AsyncSession = Depends(get_db),
    config_in: TractorConfigCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Configure or update tractor cost parameters for a farm.
    """
    farm_repo = FarmRepository(db)
    farm = await farm_repo.get(config_in.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to configure tractor costs for this farm."
        )
        
    query = select(TractorConfig).where(TractorConfig.farm_id == config_in.farm_id)
    result = await db.execute(query)
    config = result.scalar_one_or_none()
    
    # Cost calculation formula
    calculated_cost = (
        (config_in.diesel_price * config_in.mileage_liters_per_hour) +
        config_in.driver_charge_per_hour +
        config_in.maintenance_cost_per_hour
    )
    
    if config:
        config.diesel_price = config_in.diesel_price
        config.mileage_liters_per_hour = config_in.mileage_liters_per_hour
        config.driver_charge_per_hour = config_in.driver_charge_per_hour
        config.maintenance_cost_per_hour = config_in.maintenance_cost_per_hour
        config.calculated_cost_per_hour = calculated_cost
    else:
        config = TractorConfig(
            farm_id=config_in.farm_id,
            diesel_price=config_in.diesel_price,
            mileage_liters_per_hour=config_in.mileage_liters_per_hour,
            driver_charge_per_hour=config_in.driver_charge_per_hour,
            maintenance_cost_per_hour=config_in.maintenance_cost_per_hour,
            calculated_cost_per_hour=calculated_cost
        )
    
    db.add(config)
    await db.flush()
    await db.refresh(config)
    return config

@router.post("/calculate", response_model=ExpenseResponse)
async def calculate_and_add_tractor_expense(
    *,
    db: AsyncSession = Depends(get_db),
    request: TractorCalculationRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Calculate total tractor operational cost and automatically record it as a crop expense.
    """
    farm_repo = FarmRepository(db)
    
    # Verify farm ownership
    farm = await farm_repo.get(request.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot calculate tractor expenses for a farm that does not belong to you."
        )
        
    # Get tractor configuration parameters
    query = select(TractorConfig).where(TractorConfig.farm_id == request.farm_id)
    result = await db.execute(query)
    config = result.scalar_one_or_none()
    
    if not config or config.calculated_cost_per_hour == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please configure tractor cost parameters for this farm first."
        )
        
    total_cost = request.hours * float(config.calculated_cost_per_hour)
    
    # Verify crop belongs to farm
    crop = await db.get(Crop, request.crop_id)
    if not crop or crop.farm_id != request.farm_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target crop must belong to the specified farm segment."
        )
        
    # Auto-generate corresponding crop expense entry
    expense = Expense(
        farm_id=request.farm_id,
        crop_id=request.crop_id,
        category="TRACTOR",
        amount=total_cost,
        description=f"Tractor: {request.operation_name} ({request.hours} hrs @ ₹{config.calculated_cost_per_hour:.2f}/hr)",
        transaction_date=date.today()
    )
    
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return expense

@router.get("/summary/{crop_id}")
async def get_crop_tractor_summary(
    crop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve comprehensive tractor & equipment expense summary for a crop:
    - Today's tractor expense
    - Total tractor/equipment expense so far
    - Total hours used
    - Day-wise expense history with daily totals
    - Complete expense history from beginning of crop
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
            detail="Not enough permissions to access tractor records for this crop."
        )

    # Fetch all tractor expenses for this crop, ordered by date descending
    query = (
        select(Expense)
        .where((Expense.crop_id == crop_id) & (Expense.category == "TRACTOR"))
        .order_by(Expense.transaction_date.desc(), Expense.created_at.desc())
    )
    result = await db.execute(query)
    expenses = list(result.scalars().all())

    today = date.today()
    today_expense = 0.0
    today_hours = 0.0
    total_expense = 0.0
    total_hours = 0.0

    # Group by transaction_date
    day_map = {}

    for exp in expenses:
        exp_amount = float(exp.amount or 0.0)
        exp_hours = float(exp.hours or 0.0)
        exp_rate = float(exp.rate_per_hour or 0.0)

        total_expense += exp_amount
        total_hours += exp_hours

        if exp.transaction_date == today:
            today_expense += exp_amount
            today_hours += exp_hours

        date_str = exp.transaction_date.isoformat()
        if date_str not in day_map:
            day_map[date_str] = {
                "date": date_str,
                "total_cost": 0.0,
                "total_hours": 0.0,
                "entries": []
            }
        day_map[date_str]["total_cost"] += exp_amount
        day_map[date_str]["total_hours"] += exp_hours
        day_map[date_str]["entries"].append({
            "id": str(exp.id),
            "farm_id": str(exp.farm_id),
            "crop_id": str(exp.crop_id),
            "equipment_name": exp.equipment_name or "Tractor",
            "hours": exp_hours,
            "rate_per_hour": exp_rate,
            "amount": exp_amount,
            "description": exp.description,
            "transaction_date": date_str,
            "created_at": exp.created_at.isoformat() if exp.created_at else None
        })

    day_wise_history = list(day_map.values())

    return {
        "crop_id": str(crop.id),
        "crop_name": crop.name,
        "crop_variety": crop.variety,
        "sowing_date": crop.sowing_date.isoformat() if crop.sowing_date else None,
        "status": crop.status,
        "today_expense": round(today_expense, 2),
        "today_hours": round(today_hours, 2),
        "total_expense": round(total_expense, 2),
        "total_hours": round(total_hours, 2),
        "total_entries": len(expenses),
        "day_wise_history": day_wise_history,
        "all_entries": [
            {
                "id": str(exp.id),
                "farm_id": str(exp.farm_id),
                "crop_id": str(exp.crop_id),
                "equipment_name": exp.equipment_name or "Tractor",
                "hours": float(exp.hours or 0.0),
                "rate_per_hour": float(exp.rate_per_hour or 0.0),
                "amount": float(exp.amount or 0.0),
                "description": exp.description,
                "transaction_date": exp.transaction_date.isoformat(),
                "created_at": exp.created_at.isoformat() if exp.created_at else None
            }
            for exp in expenses
        ]
    }

