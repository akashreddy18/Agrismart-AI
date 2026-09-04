import os
import sys
import unittest
import numpy as np
import cv2
from io import BytesIO
from fastapi.testclient import TestClient
from datetime import date

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from contextlib import asynccontextmanager
@asynccontextmanager
async def dummy_lifespan(app):
    yield

from app.main import app
app.router.lifespan_context = dummy_lifespan

from app.api.deps import get_current_user
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.db.base import Base
from app.db.session import engine, SessionLocal
import asyncio

import uuid
client = TestClient(app)

class TestDiseaseE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.user_id = uuid.UUID("00000000-0000-0000-0000-000000000099")
        cls.mock_user = User(
            id=cls.user_id,
            phone_number="+919988776655",
            email="e2e_farmer@agrismart.ai",
            full_name="Kisan Ramesh"
        )
        app.dependency_overrides[get_current_user] = lambda: cls.mock_user

        # Create database tables and seed test farm & crop
        async def seed_data():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            async with SessionLocal() as session:
                farm = Farm(
                    user_id=cls.user_id,
                    name="Krishna Delta Fields",
                    location_name="Tenali, Andhra Pradesh",
                    latitude=16.24,
                    longitude=80.64,
                    acreage=5.0,
                    soil_type="Clay"
                )
                session.add(farm)
                await session.flush()
                cls.farm_id = str(farm.id)

                crop = Crop(
                    farm_id=farm.id,
                    name="Paddy (BPT 5204)",
                    variety="Samba Mahsuri",
                    sowing_date=date(2026, 6, 15),
                    expected_harvest_date=date(2026, 10, 30),
                    stage="VEGETATIVE",
                    status="ACTIVE"
                )
                session.add(crop)
                await session.flush()
                cls.crop_id = str(crop.id)
                await session.commit()

        asyncio.run(seed_data())

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_complete_disease_detection_and_expense_lifecycle(self):
        print("\n=== Running E2E Crop Disease & Expense Test ===")
        # 1. Prepare sample leaf image with blast lesion characteristics
        img = np.full((128, 128, 3), (35, 140, 45), dtype=np.uint8)
        cv2.circle(img, (60, 60), 18, (15, 65, 115), -1)
        _, img_encoded = cv2.imencode('.jpg', img)

        # 2. Call /api/v1/disease/detect
        files = {
            "file": ("paddy_leaf_blast.jpg", BytesIO(img_encoded.tobytes()), "image/jpeg")
        }
        form_data = {
            "crop_id": self.crop_id,
            "farm_id": self.farm_id,
            "crop_name": "Paddy",
            "growth_stage": "VEGETATIVE",
            "soil_type": "Clay",
            "previous_fertilizer": "Urea 50kg, DAP 25kg"
        }

        print("1. Submitting leaf image to /api/v1/disease/detect...")
        detect_res = client.post("/api/v1/disease/detect", files=files, data=form_data)
        self.assertEqual(detect_res.status_code, 200)
        data = detect_res.json()

        # 3. Verify all 9 required fields in farmer-friendly format
        self.assertIn("Paddy", data["crop_name"])
        self.assertIn("Blast", data["disease_name"])
        self.assertTrue(data["confidence"] > 0.8)
        self.assertIn("%", data["confidence_percentage"])
        self.assertIn("symptoms", data)
        self.assertIn("possible_cause", data)
        self.assertTrue(len(data["recommendations"]) >= 3)
        self.assertIsNotNone(data["approx_quantity"])
        self.assertIsNotNone(data["approx_cost"])
        self.assertIn("safety_instructions", data)
        self.assertIn("diagnosis_date", data)
        self.assertIn("disclaimer", data)
        self.assertIn("agricultural officer", data["disclaimer"].lower())
        self.assertIsNotNone(data["id"], "History record ID should be generated and returned")
        history_id = data["id"]
        print(f"-> Detected: {data['disease_name']} ({data['confidence_percentage']})")
        print(f"-> History Record ID: {history_id}")

        # 4. Fetch Disease History for this crop
        print("2. Fetching Disease History via /api/v1/disease/history...")
        hist_res = client.get(f"/api/v1/disease/history?crop_id={self.crop_id}")
        self.assertEqual(hist_res.status_code, 200)
        hist_items = hist_res.json()
        self.assertTrue(len(hist_items) > 0)
        matched = next((item for item in hist_items if item["id"] == history_id), None)
        self.assertIsNotNone(matched)
        self.assertEqual(matched["disease_name"], data["disease_name"])
        self.assertIsNone(matched["expense_id"], "No expense should be linked yet")

        # 5. Add Treatment to Crop Expenses
        print("3. Farmer purchases recommended fungicide. Adding to Crop Expenses...")
        rec = data["recommendations"][0]
        expense_payload = {
            "fertilizer_name": rec["name"],
            "quantity": "250 g",
            "amount_spent": 520.0,
            "purchase_date": "2026-09-04",
            "crop_id": self.crop_id,
            "farm_id": self.farm_id,
            "notes": "Purchased at local cooperative for leaf blast control"
        }
        add_exp_res = client.post(f"/api/v1/disease/history/{history_id}/add-expense", json=expense_payload)
        self.assertEqual(add_exp_res.status_code, 200)
        exp_data = add_exp_res.json()
        self.assertEqual(exp_data["status"], "success")
        self.assertIn("expense_id", exp_data)
        expense_id = exp_data["expense_id"]
        print(f"-> Expense logged: ID {expense_id}, Amount: Rs. {exp_data['amount']:.2f}")

        # 6. Verify Expense shows in overall crop expenses
        print("4. Verifying expense is listed in /api/v1/expenses for this crop...")
        exp_list_res = client.get(f"/api/v1/expenses?crop_id={self.crop_id}")
        self.assertEqual(exp_list_res.status_code, 200)
        all_crop_expenses = exp_list_res.json()
        matched_exp = next((e for e in all_crop_expenses if e["id"] == expense_id), None)
        self.assertIsNotNone(matched_exp)
        self.assertEqual(float(matched_exp["amount"]), 520.0)
        self.assertIn("Treatment:", matched_exp["description"])
        print("-> Verified expense in crop account successfully")

        # 7. Re-verify Disease History to ensure expense details are updated
        print("5. Re-checking Disease History to confirm expense link...")
        hist_res_2 = client.get(f"/api/v1/disease/history/{history_id}")
        self.assertEqual(hist_res_2.status_code, 200)
        updated_hist = hist_res_2.json()
        self.assertEqual(updated_hist["expense_id"], expense_id)
        self.assertEqual(updated_hist["fertilizer_purchased"], rec["name"])
        self.assertEqual(float(updated_hist["expense_amount"]), 520.0)
        print("=== E2E Test Completed Successfully! ===\n")

if __name__ == "__main__":
    unittest.main()
