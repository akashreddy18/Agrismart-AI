from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.weather import WeatherForecastResponse
from app.services.weather_service import WeatherService
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="Latitude of the location"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="Longitude of the location"),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get localized weather forecasts and farming smart advisories for the given coordinate parameters.
    """
    try:
        forecast = WeatherService.get_forecast(latitude, longitude)
        return forecast
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving weather telemetry: {str(e)}"
        )
