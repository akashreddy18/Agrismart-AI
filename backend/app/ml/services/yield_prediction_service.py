import os
import pickle
import numpy as np
import pandas as pd
from app.ml.training.train_yield_prediction import train

class YieldPredictionService:
    _model = None
    
    # Categories mapping
    SOIL_MAPPING = {
        "clay": 0, "black cotton": 1, "sandy": 2, "red soil": 3, "loamy": 4, "silty": 5
    }
    CROP_MAPPING = {
        "rice": 0, "banana": 1, "cotton": 2, "chickpea": 3, "maize": 4, "mango": 5
    }

    @classmethod
    def get_model(cls):
        if cls._model is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, 'models', 'yield_prediction_model.pkl')
            if not os.path.exists(model_path):
                print("Yield prediction model not found. Training on-the-fly...")
                train()
            with open(model_path, 'rb') as f:
                cls._model = pickle.load(f)
        return cls._model

    @classmethod
    def predict(
        cls, crop_name: str, soil_type: str, acreage: float, rainfall: float, fertilizer_usage: float
    ):
        model = cls.get_model()
        
        # Resolve encodings with default fallback (Loamy/Maize)
        crop_encoded = cls.CROP_MAPPING.get(crop_name.lower().strip(), 4)
        soil_encoded = cls.SOIL_MAPPING.get(soil_type.lower().strip(), 4)

        features = pd.DataFrame([{
            'crop_encoded': crop_encoded,
            'soil_encoded': soil_encoded,
            'acreage': acreage,
            'rainfall': rainfall,
            'fertilizer_usage': fertilizer_usage
        }])
        
        predicted_yield = float(model.predict(features)[0])
        yield_per_acre = predicted_yield / acreage if acreage > 0 else 0.0
        
        return predicted_yield, yield_per_acre
