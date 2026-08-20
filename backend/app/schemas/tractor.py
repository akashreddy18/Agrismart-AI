import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TractorConfigBase(BaseModel):
    diesel_price: float = Field(..., ge=0.0, description="Price of diesel per liter")
    mileage_liters_per_hour: float = Field(..., ge=0.0, description="Diesel consumption rate in liters per hour")
    driver_charge_per_hour: float = Field(..., ge=0.0, description="Driver wage rate per hour")
    maintenance_cost_per_hour: float = Field(..., ge=0.0, description="Depreciation and maintenance rate per hour")

class TractorConfigCreate(TractorConfigBase):
    farm_id: uuid.UUID = Field(..., description="ID of the associated farm")

class TractorConfigResponse(TractorConfigBase):
    id: uuid.UUID
    farm_id: uuid.UUID
    calculated_cost_per_hour: float
    updated_at: datetime

    class Config:
        from_attributes = True

class TractorCalculationRequest(BaseModel):
    farm_id: uuid.UUID
    crop_id: uuid.UUID
    hours: float = Field(..., gt=0.0, description="Number of operational hours")
    operation_name: str = Field(..., description="Type of operation, e.g. Tilling, Harvesting")
