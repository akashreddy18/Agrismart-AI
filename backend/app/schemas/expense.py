import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

class ExpenseBase(BaseModel):
    category: str = Field(..., description="SEEDS, FERTILIZERS, PESTICIDES, LABOUR, TRACTOR, DIESEL, IRRIGATION, TRANSPORT, OTHER")
    amount: float = Field(..., gt=0.0, description="Expense amount in currency units")
    description: Optional[str] = Field(None, description="Detailed notes on the expenditure")
    transaction_date: date = Field(..., description="Date of the expenditure transaction")

class ExpenseCreate(ExpenseBase):
    farm_id: uuid.UUID = Field(..., description="Associated farm ID")
    crop_id: Optional[uuid.UUID] = Field(None, description="Associated crop ID (if crop-specific)")

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None

class ExpenseResponse(ExpenseBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    crop_id: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True
