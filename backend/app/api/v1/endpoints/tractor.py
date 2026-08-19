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
