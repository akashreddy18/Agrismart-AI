import math
import random
from datetime import date, timedelta
from typing import Dict, Any

class WeatherService:
    @staticmethod
    def get_forecast(latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Retrieves weather telemetry.
        Generates realistic forecast patterns based on geographical coordinates to enable testing
        without external API dependencies, but remains ready to wire in OpenWeather.
        """
        # Determine base temperature and weather context using latitude
        # e.g. warmer near equator, colder at higher latitudes
        base_temp = 32.0 - abs(latitude - 15.0) * 0.4
        
        # Determine humidity profile using longitude
        # e.g. coastal regions vs inland arid areas
        base_humidity = 60 + int(math.sin(longitude / 10.0) * 20)
        base_humidity = max(10, min(95, base_humidity))
        
        # Deterministic random seed using coordinates to keep forecast stable for the day
        seed_val = int(abs(latitude * 100) + abs(longitude * 100))
        random.seed(seed_val)

        # Generate current weather
        temp_offset = random.uniform(-2.0, 2.0)
        current_temp = round(base_temp + temp_offset, 1)
        current_humidity = int(base_humidity + random.randint(-10, 10))
        current_humidity = max(10, min(95, current_humidity))
        current_wind = round(random.uniform(5.0, 25.0), 1)
        
        # High rain probability if humidity > 70%
        rain_prob = 0.85 if current_humidity > 70 else round(random.uniform(0.05, 0.50), 2)
        
        if rain_prob > 0.70:
            description = "Rain Showers"
        elif rain_prob > 0.40:
            description = "Mostly Cloudy"
        elif current_humidity > 80:
            description = "Fog / Humid"
        else:
            description = "Sunny"

        current_data = {
            "temp": current_temp,
            "humidity": current_humidity,
            "wind_speed": current_wind,
            "rain_probability": rain_prob,
            "description": description
        }

        # Generate 7-day forecast
        forecast_days = []
        start_date = date.today()
        
        advisories = [
            "Optimal day for general field work. No rainfall expected.",
            "High probability of rain. Postpone scheduled nitrogen fertilizer sprays to prevent run-off.",
            "Moderate wind levels detected. Postpone pesticide spraying to avoid drift to adjacent crops.",
            "High humidity and mild heat may trigger fungal diseases. Inspect crop leaves closely.",
            "Optimal moisture conditions. Excellent time for tilling and preparing seed beds.",
            "Low humidity and high sun exposure. Increase irrigation frequency by 15%."
        ]

        for i in range(7):
            forecast_date = start_date + timedelta(days=i)
            # Add some variance per day
            day_seed = seed_val + i
            random.seed(day_seed)
            
            day_temp_offset = random.uniform(-4.0, 4.0)
            t_min = round(base_temp - 5.0 + day_temp_offset, 1)
            t_max = round(base_temp + 5.0 + day_temp_offset, 1)
            day_humidity = max(10, min(95, int(base_humidity + random.randint(-15, 15))))
            
            day_rain_prob = 0.90 if day_humidity > 75 else round(random.uniform(0.0, 0.60), 2)
            
            # Match appropriate advisory
            if day_rain_prob > 0.70:
                adv = advisories[1] # postphone fertilizer
            elif t_max > 36.0:
                adv = advisories[5] # increase irrigation
            elif day_humidity > 80:
                adv = advisories[3] # fungal alert
            elif day_rain_prob < 0.20:
                adv = advisories[0] # optimal field work
            else:
                adv = advisories[4] # excellent tilling

            forecast_days.append({
                "date": forecast_date.isoformat(),
                "temp_min": t_min,
                "temp_max": t_max,
                "rain_probability": day_rain_prob,
                "advisory": adv
            })

        return {
            "current": current_data,
            "forecast": forecast_days
        }
