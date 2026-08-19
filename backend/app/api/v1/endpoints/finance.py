from typing import Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.models.crop import Crop
from app.models.farm import Farm
from app.services.finance_service import FinanceService
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/summary/{crop_id}")
async def read_crop_financial_summary(
    crop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get financial performance metrics (Total Investment, Cost/Acre, Cost/Kg, Profit, ROI) for a crop.
    """
    # Verify crop exists and farm ownership
    crop = await db.get(Crop, crop_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop record not found."
        )
        
    farm = await db.get(Farm, crop.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access financial summary for this crop."
        )
        
    finance_service = FinanceService(db)
    summary = await finance_service.get_crop_financial_summary(crop_id)
    return summary
