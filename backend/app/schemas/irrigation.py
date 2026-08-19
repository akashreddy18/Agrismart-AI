import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

class IrrigationBase(BaseModel):
    duration_minutes: int = Field(..., gt=0, description="Duration of watering in minutes")
    water_consumed_liters: Optional[float] = Field(None, ge=0.0, description="Estimated water consumption in liters")
    cost: float = Field(..., ge=0.0, description="Pumping energy/electricity costs")
    irrigation_date: date = Field(..., description="Date of irrigation event")

class IrrigationCreate(IrrigationBase):
    crop_id: uuid.UUID = Field(..., description="Associated crop lifecycle ID")

class IrrigationResponse(IrrigationBase):
    id: uuid.UUID
    crop_id: uuid.UUID

    class Config:
        from_attributes = True
