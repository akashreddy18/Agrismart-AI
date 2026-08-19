import uuid
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field

class CropBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Crop name, e.g., Paddy, Cotton")
    variety: Optional[str] = Field(None, max_length=100, description="Specific seed variety, e.g., IR64")
    sowing_date: date = Field(..., description="Date of sowing seeds")
    expected_harvest_date: date = Field(..., description="Expected date of harvest")
    stage: str = Field("SOWING", description="Stage: SOWING, VEGETATIVE, FLOWERING, HARVEST_READY, HARVESTED")
    status: str = Field("ACTIVE", description="Status: ACTIVE, COMPLETED, FAILED")

class CropCreate(CropBase):
    farm_id: uuid.UUID = Field(..., description="ID of the associated farm")

class CropUpdate(BaseModel):
    name: Optional[str] = None
    variety: Optional[str] = None
    sowing_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    stage: Optional[str] = None
    status: Optional[str] = None

class CropResponse(CropBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
