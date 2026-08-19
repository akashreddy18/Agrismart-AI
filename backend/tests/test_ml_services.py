import os
import sys
import unittest
import numpy as np
import cv2
from io import BytesIO
from fastapi.testclient import TestClient

# Adjust path to import backend app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager

@asynccontextmanager
async def dummy_lifespan(app):
    yield

from app.main import app
app.router.lifespan_context = dummy_lifespan

from app.ml.training.train_crop_recommendation import train as train_rec
from app.ml.training.train_yield_prediction import train as train_yield
from app.ml.training.train_price_prediction import train as train_price
from app.ml.training.train_disease_detection import train as train_disease
from app.api.deps import get_current_user
from app.models.user import User

# Setup FastAPI Test Client
client = TestClient(app)

class TestMLServices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n=== Initializing ML Services Training ===")
        # Run training scripts to generate .pkl and .h5 models in backend/app/ml/models/
        train_rec()
        train_yield()
        train_price()
        train_disease()
        print("=== Training Complete. Models Generated ===\n")

        # Mock user override for FastAPI endpoints authentication
        cls.mock_user = User(
            id="00000000-0000-0000-0000-000000000000",
            phone_number="+919999900000",
            email="ml_test_user@example.com",
            full_name="ML Tester"
        )
        app.dependency_overrides[get_current_user] = lambda: cls.mock_user

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_crop_recommendation_endpoint(self):
        print("Testing Crop Recommendation REST API...")
        payload = {
            "N": 90.0,
            "P": 42.0,
            "K": 43.0,
            "temperature": 28.0,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 200.0
        }
        response = client.post("/api/v1/ml/recommend-crop", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recommended_crop", data)
        self.assertIn("confidence", data)
        print(f"-> Recommended Crop: {data['recommended_crop']} (Conf: {data['confidence']:.2f})")

    def test_yield_prediction_endpoint(self):
        print("Testing Yield Prediction REST API...")
        payload = {
            "crop_name": "Maize",
            "soil_type": "Loamy",
            "acreage": 4.5,
            "rainfall": 150.0,
            "fertilizer_usage": 180.0
        }
        response = client.post("/api/v1/ml/predict-yield", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_yield_kg", data)
        self.assertIn("yield_per_acre_kg", data)
        print(f"-> Predicted Yield: {data['predicted_yield_kg']:.2f} kg")

    def test_price_prediction_endpoint(self):
        print("Testing Price Prediction REST API...")
        payload = {
            "crop_name": "Tomato",
            "mandi_name": "Bowenpally Mandi",
            "month": 8,
            "historical_price_avg": 3000.0
        }
        response = client.post("/api/v1/ml/predict-price", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predicted_price_per_qtl", data)
        self.assertIn("price_per_kg", data)
        print(f"-> Predicted Price: ₹{data['predicted_price_per_qtl']:.2f}/Qtl (₹{data['price_per_kg']:.2f}/kg)")

    def test_disease_detection_endpoint(self):
        print("Testing Disease Detection REST API (Multipart Leaf Upload)...")
        # Create a mock image block (128x128x3 RGB) in memory using OpenCV
        img = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
        _, img_encoded = cv2.imencode('.jpg', img)
        img_bytes = img_encoded.tobytes()

        # Send multipart file post
        files = {
            "file": ("leaf_test.jpg", BytesIO(img_bytes), "image/jpeg")
        }
        response = client.post("/api/v1/ml/detect-disease", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("disease_detected", data)
        self.assertIn("confidence", data)
        self.assertIn("treatment_advisory", data)
        print(f"-> Classified Disease: {data['disease_detected']} (Conf: {data['confidence']:.2f})")

    def test_smart_selling_endpoint(self):
        print("Testing Smart Selling Opportunity REST API...")
        payload = {
            "crop_name": "Tomato",
            "expected_yield_kg": 5000.0,
            "current_market_price_per_kg": 32.0,
            "storage_cost_per_day": 25.0,
            "expected_price_trend": "UP"
        }
        response = client.post("/api/v1/ml/smart-selling", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("recommendation", data)
        self.assertIn("holding_details", data)
        self.assertTrue(len(data["holding_details"]) > 0)
        print(f"-> Smart Selling Recommendation: {data['recommendation']}")

if __name__ == "__main__":
    unittest.main()
