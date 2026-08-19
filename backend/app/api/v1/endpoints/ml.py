from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ml import (
    CropRecommendationRequest, CropRecommendationResponse,
    YieldPredictionRequest, YieldPredictionResponse,
    PricePredictionRequest, PricePredictionResponse,
    DiseaseDetectionResponse,
    SmartSellingRequest, SmartSellingResponse
)
from app.ml.services.crop_recommendation_service import CropRecommendationService
from app.ml.services.yield_prediction_service import YieldPredictionService
from app.ml.services.price_prediction_service import PricePredictionService
from app.ml.services.disease_detection_service import DiseaseDetectionService
from app.ml.services.smart_selling_service import SmartSellingService

router = APIRouter()

@router.post("/recommend-crop", response_model=CropRecommendationResponse)
def recommend_crop(
    request: CropRecommendationRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Recommend the optimal crop category based on N, P, K, pH, rainfall, temperature, and humidity inputs.
    """
    try:
        crop, confidence = CropRecommendationService.recommend(
            N=request.N, P=request.P, K=request.K,
            temp=request.temperature, hum=request.humidity,
            ph=request.ph, rain=request.rainfall
        )
        return {
            "recommended_crop": crop,
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in Crop Recommendation classifier: {str(e)}"
        )

@router.post("/predict-yield", response_model=YieldPredictionResponse)
def predict_yield(
    request: YieldPredictionRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Predict crop harvest yield (kg) and crop productivity index per acre.
    """
    try:
        predicted_yield, yield_per_acre = YieldPredictionService.predict(
            crop_name=request.crop_name,
            soil_type=request.soil_type,
            acreage=request.acreage,
            rainfall=request.rainfall,
            fertilizer_usage=request.fertilizer_usage
        )
        return {
            "predicted_yield_kg": predicted_yield,
            "yield_per_acre_kg": yield_per_acre
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in Yield Regressor model: {str(e)}"
        )

@router.post("/predict-price", response_model=PricePredictionResponse)
def predict_price(
    request: PricePredictionRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Forecast expected mandi wholesale commodity rates per quintal.
    """
    try:
        predicted_price_qtl, price_per_kg = PricePredictionService.predict(
            crop_name=request.crop_name,
            mandi_name=request.mandi_name,
            month=request.month,
            historical_price_avg=request.historical_price_avg
        )
        return {
            "predicted_price_per_qtl": predicted_price_qtl,
            "price_per_kg": price_per_kg
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in Price prediction model: {str(e)}"
        )

@router.post("/detect-disease", response_model=DiseaseDetectionResponse)
async def detect_disease(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Diagnose leaf disease from uploaded image using OpenCV preprocessing and a TensorFlow CNN model.
    """
    try:
        # Read uploaded image bytes
        image_bytes = await file.read()
        
        disease, confidence, advisory = DiseaseDetectionService.detect(image_bytes)
        
        return {
            "disease_detected": disease,
            "confidence": confidence,
            "treatment_advisory": advisory
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in CNN Disease Detection service: {str(e)}"
        )

@router.post("/smart-selling", response_model=SmartSellingResponse)
def smart_selling(
    request: SmartSellingRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Decide whether to sell crop immediately or store to maximize revenue margins.
    """
    try:
        recommendations = SmartSellingService.recommend(
            crop_name=request.crop_name,
            expected_yield_kg=request.expected_yield_kg,
            current_market_price_per_kg=request.current_market_price_per_kg,
            storage_cost_per_day=request.storage_cost_per_day,
            expected_price_trend=request.expected_price_trend
        )
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in Smart Selling recommender: {str(e)}"
        )
