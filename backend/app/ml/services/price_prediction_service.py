import os
import pickle
import numpy as np
import pandas as pd
from app.ml.training.train_price_prediction import train

class PricePredictionService:
    _model = None

    CROP_MAPPING = {
        "rice": 0, "banana": 1, "cotton": 2, "chickpea": 3, "maize": 4, "mango": 5
    }
    MANDI_MAPPING = {
        "guntur mandi": 0, "bowenpally mandi": 1, "bowenpally market": 2, "guntur market": 3, "hyderabad mandi": 4
    }

    @classmethod
    def get_model(cls):
        if cls._model is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, 'models', 'price_prediction_model.pkl')
            if not os.path.exists(model_path):
                print("Price prediction model not found. Training on-the-fly...")
                train()
            with open(model_path, 'rb') as f:
                cls._model = pickle.load(f)
        return cls._model

    @classmethod
    def predict(
        cls, crop_name: str, mandi_name: str, month: int, historical_price_avg: float
    ):
        model = cls.get_model()

        crop_encoded = cls.CROP_MAPPING.get(crop_name.lower().strip(), 0)
        mandi_encoded = cls.MANDI_MAPPING.get(mandi_name.lower().strip(), 0)

        features = pd.DataFrame([{
            'crop_encoded': crop_encoded,
            'mandi_encoded': mandi_encoded,
            'month': month,
            'historical_price_avg': historical_price_avg
        }])

        predicted_price_qtl = float(model.predict(features)[0])
        # 1 Quintal = 100 Kilograms
        price_per_kg = predicted_price_qtl / 100.0

        return predicted_price_qtl, price_per_kg
