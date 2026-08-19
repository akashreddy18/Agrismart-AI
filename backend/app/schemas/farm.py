import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class FarmBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Name of the farm segment")
    location_name: str = Field(..., min_length=2, max_length=255, description="Regional location name")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    acreage: float = Field(..., gt=0.0, description="Size of the farm in acres")
    soil_type: str = Field(..., description="Soil category: Clay, Black, Sandy, Red, Loamy, etc.")

class FarmCreate(FarmBase):
    pass

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    acreage: Optional[float] = None
    soil_type: Optional[str] = None

class FarmResponse(FarmBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
