import os
import pickle
import numpy as np
import pandas as pd
from app.ml.training.train_crop_recommendation import train

class CropRecommendationService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, 'models', 'crop_recommendation_model.pkl')
            if not os.path.exists(model_path):
                print("Crop recommendation model not found. Training on-the-fly...")
                train()
            with open(model_path, 'rb') as f:
                cls._model = pickle.load(f)
        return cls._model

    @classmethod
    def recommend(
        cls, N: float, P: float, K: float, temp: float, hum: float, ph: float, rain: float
    ):
        model = cls.get_model()
        features = pd.DataFrame([{
            'N': N, 'P': P, 'K': K,
            'temperature': temp, 'humidity': hum,
            'ph': ph, 'rainfall': rain
        }])
        
        predicted_crop = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))
        
        return predicted_crop, confidence
