import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

class LabourBase(BaseModel):
    worker_name: str = Field(..., min_length=2, max_length=100, description="Name of the worker")
    work_type: str = Field(..., min_length=2, max_length=100, description="Task category, e.g. Weeding, Spraying")
    days_worked: int = Field(..., gt=0, description="Total days of work completed")
    daily_wage: float = Field(..., gt=0.0, description="Daily payout rate for this worker")
    recorded_date: date = Field(..., description="Date of work logging")

class LabourCreate(LabourBase):
    farm_id: uuid.UUID = Field(..., description="ID of the associated farm")
    crop_id: Optional[uuid.UUID] = Field(None, description="Optional associated crop ID to sync with expenses")

class LabourUpdate(BaseModel):
    worker_name: Optional[str] = None
    work_type: Optional[str] = None
    days_worked: Optional[int] = None
    daily_wage: Optional[float] = None
    recorded_date: Optional[date] = None

class LabourResponse(LabourBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    total_cost: float

    class Config:
        from_attributes = True
