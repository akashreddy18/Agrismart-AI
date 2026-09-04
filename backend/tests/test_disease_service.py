import os
import sys
import unittest
import numpy as np
import cv2
import json
from io import BytesIO
from fastapi.testclient import TestClient

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
@asynccontextmanager
async def dummy_lifespan(app):
    yield

from app.main import app
app.router.lifespan_context = dummy_lifespan

from app.api.deps import get_current_user
from app.models.user import User
from app.ml.services.disease_detection_service import DiseaseDetectionService

client = TestClient(app)

class TestDiseaseService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_user = User(
            id="00000000-0000-0000-0000-000000000001",
            phone_number="+919876543210",
            email="farmer_test@agrismart.ai",
            full_name="Ramesh Reddy"
        )
        app.dependency_overrides[get_current_user] = lambda: cls.mock_user

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_paddy_blast_detection(self):
        # Create mock image with necrotic spotting
        img = np.full((128, 128, 3), (40, 140, 50), dtype=np.uint8)
        # Add brown/yellow lesion spots
        cv2.circle(img, (64, 64), 20, (20, 60, 100), -1)
        cv2.circle(img, (30, 30), 10, (30, 80, 120), -1)
        _, img_encoded = cv2.imencode('.jpg', img)
        image_bytes = img_encoded.tobytes()

        res = DiseaseDetectionService.analyze_leaf(
            image_bytes=image_bytes,
            crop_name="Paddy",
            growth_stage="VEGETATIVE",
            soil_type="Clay",
            previous_fertilizer="Urea 50kg"
        )
        self.assertEqual(res["crop_name"], "Paddy (Rice)")
        self.assertIn("Blast", res["disease_name"])
        self.assertTrue(len(res["recommendations"]) >= 3)
        self.assertIn("symptoms", res)
        self.assertIn("possible_cause", res)
        self.assertIn("safety_instructions", res)
        # Check that excess nitrogen warning was added due to previous_fertilizer
        rec_names = [r["name"] for r in res["recommendations"]]
        self.assertTrue(any("Nitrogen" in n for n in rec_names))
        print(f"Paddy Diagnosis: {res['disease_name']} ({res['confidence_percentage']})")

    def test_tomato_early_blight_detection(self):
        # Create mock leaf with concentric target spot pattern
        img = np.full((128, 128, 3), (30, 150, 40), dtype=np.uint8)
        cv2.circle(img, (60, 60), 25, (15, 55, 95), -1)
        _, img_encoded = cv2.imencode('.jpg', img)
        image_bytes = img_encoded.tobytes()

        res = DiseaseDetectionService.analyze_leaf(
            image_bytes=image_bytes,
            crop_name="Tomato",
            growth_stage="FLOWERING",
            soil_type="Red Soil"
        )
        self.assertEqual(res["crop_name"], "Tomato")
        self.assertIn("Blight", res["disease_name"])
        self.assertIn("safety_instructions", res)
        # Check flowering safety alert
        self.assertTrue("FLOWERING" in res["safety_instructions"] or "flowering" in res["safety_instructions"].lower())
        print(f"Tomato Diagnosis: {res['disease_name']} ({res['confidence_percentage']})")

    def test_healthy_leaf_detection(self):
        # Create solid clean green leaf image
        img = np.full((128, 128, 3), (45, 175, 55), dtype=np.uint8)
        _, img_encoded = cv2.imencode('.jpg', img)
        image_bytes = img_encoded.tobytes()

        res = DiseaseDetectionService.analyze_leaf(
            image_bytes=image_bytes,
            crop_name="Paddy"
        )
        self.assertIn("Healthy", res["disease_name"])
        self.assertTrue(res["confidence"] >= 0.85)
        print(f"Healthy Diagnosis: {res['disease_name']} ({res['confidence_percentage']})")

    def test_detect_endpoint_multipart(self):
        img = np.full((128, 128, 3), (40, 150, 45), dtype=np.uint8)
        cv2.circle(img, (50, 50), 18, (15, 60, 110), -1)
        _, img_encoded = cv2.imencode('.jpg', img)

        files = {
            "file": ("leaf.jpg", BytesIO(img_encoded.tobytes()), "image/jpeg")
        }
        data = {
            "crop_name": "Cotton",
            "growth_stage": "VEGETATIVE",
            "soil_type": "Black Cotton"
        }

        response = client.post("/api/v1/disease/detect", files=files, data=data)
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["crop_name"], "Cotton")
        self.assertIn("disease_name", json_data)
        self.assertIn("confidence_percentage", json_data)
        self.assertIn("symptoms", json_data)
        self.assertIn("possible_cause", json_data)
        self.assertTrue(len(json_data["recommendations"]) >= 2)
        self.assertIn("disclaimer", json_data)
        print(f"Endpoint Diagnosis: {json_data['disease_name']} ({json_data['confidence_percentage']})")

if __name__ == "__main__":
    unittest.main()
