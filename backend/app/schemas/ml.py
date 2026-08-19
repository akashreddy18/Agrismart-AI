import uuid
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field

# 1. Crop Recommendation Schemas
class CropRecommendationRequest(BaseModel):
    N: float = Field(..., ge=0.0, le=200.0, description="Nitrogen content in soil (mg/kg)")
    P: float = Field(..., ge=0.0, le=200.0, description="Phosphorus content in soil (mg/kg)")
    K: float = Field(..., ge=0.0, le=300.0, description="Potassium content in soil (mg/kg)")
    temperature: float = Field(..., ge=-10.0, le=60.0, description="Temperature in Celsius")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity in percentage")
    ph: float = Field(..., ge=3.0, le=11.0, description="Soil pH value")
    rainfall: float = Field(..., ge=0.0, le=500.0, description="Average annual rainfall (mm)")

class CropRecommendationResponse(BaseModel):
    recommended_crop: str = Field(..., description="Name of the optimal crop suitable for soil")
    confidence: float = Field(..., description="Classifier probability score")

# 2. Yield Prediction Schemas
class YieldPredictionRequest(BaseModel):
    crop_name: str = Field(..., description="Crop type: Rice, Banana, Cotton, Chickpea, Maize, Mango")
    soil_type: str = Field(..., description="Soil type: Clay, Black Cotton, Sandy, Red Soil, Loamy, Silty")
    acreage: float = Field(..., gt=0.0, description="Land area in acres")
    rainfall: float = Field(..., ge=0.0, description="Current cycle rainfall (mm)")
    fertilizer_usage: float = Field(..., ge=0.0, description="Total fertilizer used in kg")

class YieldPredictionResponse(BaseModel):
    predicted_yield_kg: float = Field(..., description="Estimated total harvest yield in kilograms")
    yield_per_acre_kg: float = Field(..., description="Estimated crop productivity per acre")

# 3. Price Prediction Schemas
class PricePredictionRequest(BaseModel):
    crop_name: str = Field(..., description="Crop type: Rice, Banana, Cotton, Chickpea, Maize, Mango")
    mandi_name: str = Field(..., description="Mandi: Guntur Mandi, Bowenpally Mandi, Bowenpally Market, Guntur Market, Hyderabad Mandi")
    month: int = Field(..., ge=1, le=12, description="Target calendar month for prediction (1-12)")
    historical_price_avg: float = Field(..., gt=0.0, description="Previous historical price average per quintal (INR)")

class PricePredictionResponse(BaseModel):
    predicted_price_per_qtl: float = Field(..., description="Forecasted commodity price per quintal in INR")
    price_per_kg: float = Field(..., description="Estimated price per kilogram (INR/kg)")

# 4. Disease Detection Schemas
class DiseaseDetectionResponse(BaseModel):
    disease_detected: str = Field(..., description="Classified disease label: Healthy, Leaf Spot, Late Blight, Powdery Mildew")
    confidence: float = Field(..., description="Model classification softmax probability")
    treatment_advisory: str = Field(..., description="AI suggested agronomic treatment recommendation")

# 5. Smart Selling Schemas
class SmartSellingRequest(BaseModel):
    crop_name: str = Field(..., description="Crop Cycle Name")
    expected_yield_kg: float = Field(..., gt=0.0, description="Total estimated crop yield in kilograms")
    current_market_price_per_kg: float = Field(..., gt=0.0, description="Current spot price rate per kg in Mandi (INR)")
    storage_cost_per_day: float = Field(..., ge=0.0, description="Warehouse cost rate per day for entire crop volume (INR/day)")
    expected_price_trend: str = Field("STABLE", description="Trend prediction: UP, DOWN, STABLE")

class HoldingDetail(BaseModel):
    holding_days: int = Field(..., description="Number of days to store crop")
    projected_price_per_kg: float = Field(..., description="Forecasted price rate per kg (INR)")
    storage_cost: float = Field(..., description="Accumulated storage cost (INR)")
    projected_revenue: float = Field(..., description="Estimated revenue (INR)")
    net_profit: float = Field(..., description="Revenue minus storage cost (INR)")

class SmartSellingResponse(BaseModel):
    recommendation: str = Field(..., description="Decision recommendation: SELL NOW or HOLD")
    immediate_revenue: float = Field(..., description="Revenue if sold immediately (INR)")
    holding_details: List[HoldingDetail] = Field(..., description="Profits projection matrix over different storage holding periods")
