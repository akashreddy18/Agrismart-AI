import asyncio
import sys
from datetime import date
from uuid import UUID

# Adjust path to import backend app modules
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.session import engine, SessionLocal
import app.db.base
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.expense import Expense
from app.models.sales import Sales
from app.repositories.user_repo import UserRepository
from app.repositories.farm_repo import FarmRepository
from app.repositories.crop_repo import CropRepository
from app.services.finance_service import FinanceService

async def test_expense_calculations():
    print("Initializing Expense Management Integration Test...")
    print(f"Database Target: {settings.DATABASE_URL.split('@')[-1]}")
    
    async with SessionLocal() as db:
        user_repo = UserRepository(db)
        farm_repo = FarmRepository(db)
        crop_repo = CropRepository(db)
        finance_service = FinanceService(db)

        # 1. Setup Test User
        print("\n[Step 1] Creating temporary test user...")
        test_email = "test_farmer_expenses@example.com"
        test_phone = "+919999977777"
        
        # Cleanup existing test user if present
        existing_user = await user_repo.get_by_email(test_email)
        if existing_user:
            print("Cleaning up old test user...")
            await user_repo.remove(existing_user.id)
            await db.commit()
            
        test_user = User(
            phone_number=test_phone,
            email=test_email,
            password_hash="hashed_test_password_456",
            full_name="Expense Tester",
            preferred_lang="en"
        )
        await user_repo.create(test_user)
        await db.commit()
        await db.refresh(test_user)
        print(f"Test User ID: {test_user.id}")

        # 2. Setup Test Farm (5.0 Acres for clean calculations)
        print("\n[Step 2] Creating test farm of 5.0 acres...")
        test_farm = Farm(
            user_id=test_user.id,
            name="Orchard North",
            location_name="Guntur, AP",
            latitude=16.306,
            longitude=80.436,
            acreage=5.00,
            soil_type="Black Cotton"
        )
        await farm_repo.create(test_farm)
        await db.commit()
        await db.refresh(test_farm)
        print(f"Test Farm ID: {test_farm.id}")

        # 3. Setup Test Crop
        print("\n[Step 3] Sowing a test crop cycle...")
        test_crop = Crop(
            farm_id=test_farm.id,
            name="Tomato",
            variety="Arka Rakshak",
            sowing_date=date.today(),
            expected_harvest_date=date.today(),
            stage="SOWING",
            status="ACTIVE"
        )
        await crop_repo.create(test_crop)
        await db.commit()
        await db.refresh(test_crop)
        print(f"Test Crop ID: {test_crop.id}")

        # 4. Log Expenses (Seeds: 1500, Fertilizers: 3500 -> Total: 5000)
        print("\n[Step 4] Logging cost expenditures...")
        exp1 = Expense(
            farm_id=test_farm.id,
            crop_id=test_crop.id,
            category="SEEDS",
            amount=1500.00,
            description="Purchased tomato hybrid seeds",
            transaction_date=date.today()
        )
        exp2 = Expense(
            farm_id=test_farm.id,
            crop_id=test_crop.id,
            category="FERTILIZERS",
            amount=3500.00,
            description="NPK 19-19-19 chemical spray bag",
            transaction_date=date.today()
        )
        db.add(exp1)
        db.add(exp2)
        await db.flush()
        print("Logged: Seeds (Rs. 1500.00) and Fertilizers (Rs. 3500.00)")

        # 5. Log Sales (500 kg sold at ₹20/kg -> Total Income: 10000)
        print("\n[Step 5] Logging crop yield sales...")
        sale = Sales(
            crop_id=test_crop.id,
            quantity_kg=500.00,
            price_per_kg=20.00,
            buyer_name="Bowenpally Wholesale Mandi",
            transport_cost=0.00,
            total_income=10000.00,
            net_income=10000.00,
            roi=100.00,
            sale_date=date.today()
        )
        db.add(sale)
        await db.flush()
        await db.commit()
        print("Logged Sale: 500 kg sold @ Rs. 20/kg = Rs. 10,000.00 revenue")

        # 6. Execute Calculations via FinanceService
        print("\n[Step 6] Compiling financial performance report...")
        summary = await finance_service.get_crop_financial_summary(test_crop.id)
        
        print(f"Summary computed: {summary}")
        
        # 7. Assert Calculations Correctness
        # Total investment: 1500 + 3500 = 5000
        assert summary["total_investment"] == 5000.00, f"Expected total_investment 5000, got {summary['total_investment']}"
        # Cost per acre: 5000 / 5 acres = 1000
        assert summary["cost_per_acre"] == 1000.00, f"Expected cost_per_acre 1000, got {summary['cost_per_acre']}"
        # Cost per kg: 5000 / 500 kg = 10
        assert summary["cost_per_kg"] == 10.00, f"Expected cost_per_kg 10, got {summary['cost_per_kg']}"
        # Total revenue: 10000
        assert summary["total_revenue"] == 10000.00, f"Expected total_revenue 10000, got {summary['total_revenue']}"
        # Net Profit: 10000 - 5000 = 5000
        assert summary["net_profit"] == 5000.00, f"Expected net_profit 5000, got {summary['net_profit']}"
        # ROI: (5000 / 5000) * 100 = 100%
        assert summary["roi"] == 100.00, f"Expected ROI 100.0, got {summary['roi']}"
        
        print("\nValidation Assertions Successful: Financial algorithms match expected outcomes.")

        # 8. Database cleanup
        print("\n[Step 7] Deleting temporary test records...")
        await db.delete(sale)
        await db.delete(exp1)
        await db.delete(exp2)
        await crop_repo.remove(test_crop.id)
        await farm_repo.remove(test_farm.id)
        await user_repo.remove(test_user.id)
        await db.commit()
        print("Database cleanup completed successfully.")

    print("\nSUCCESS: All Expense Management Integration Tests Passed!")

if __name__ == "__main__":
    try:
        asyncio.run(test_expense_calculations())
    except AssertionError as ae:
        print(f"\nTEST FAILED (Assertion Error): {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\nTEST FAILED (Error): {e}")
        sys.exit(1)
