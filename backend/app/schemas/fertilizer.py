import uuid
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

class FertilizerBase(BaseModel):
    fertilizer_name: str = Field(..., min_length=2, max_length=100, description="Name of the fertilizer, e.g. Urea, NPK 19-19-19")
    quantity_kg: float = Field(..., gt=0.0, description="Applied quantity in kilograms")
    cost: float = Field(..., ge=0.0, description="Total cost of the applied fertilizer")
    application_date: date = Field(..., description="Date of fertilizer application")

class FertilizerCreate(FertilizerBase):
    crop_id: uuid.UUID = Field(..., description="Associated crop lifecycle ID")

class FertilizerResponse(FertilizerBase):
    id: uuid.UUID
    crop_id: uuid.UUID

    class Config:
        from_attributes = True
