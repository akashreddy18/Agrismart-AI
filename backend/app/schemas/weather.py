from typing import List, Optional
from pydantic import BaseModel, Field

class CurrentWeather(BaseModel):
    temp: float = Field(..., description="Current temperature in Celsius")
    humidity: int = Field(..., description="Current relative humidity percentage")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    rain_probability: float = Field(..., description="Probability of rain (0.0 to 1.0)")
    description: str = Field(..., description="Short weather condition description")

class DailyForecast(BaseModel):
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    temp_min: float = Field(..., description="Minimum temperature in Celsius")
    temp_max: float = Field(..., description="Maximum temperature in Celsius")
    rain_probability: float = Field(..., description="Probability of rain (0.0 to 1.0)")
    advisory: str = Field(..., description="AI Agronomy weather advice for this day")

class WeatherForecastResponse(BaseModel):
    current: CurrentWeather
    forecast: List[DailyForecast]
