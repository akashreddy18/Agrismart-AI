import asyncio
import sys
from datetime import date, timedelta
from uuid import UUID

# Adjust path to import backend app modules
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import Crop
from app.repositories.user_repo import UserRepository
from app.repositories.farm_repo import FarmRepository
from app.repositories.crop_repo import CropRepository

async def test_crop_lifecycle():
    print("Initializing Crop Management Integration Test...")
    print(f"Database Target: {settings.DATABASE_URL.split('@')[-1]}")
    
    async with SessionLocal() as db:
        user_repo = UserRepository(db)
        farm_repo = FarmRepository(db)
        crop_repo = CropRepository(db)

        # 1. Setup Test User
        print("\n[Step 1] Creating temporary test farmer...")
        test_email = "test_farmer_crops@example.com"
        test_phone = "+919999988888"
        
        # Cleanup existing test user if present from a crashed run
        existing_user = await user_repo.get_by_email(test_email)
        if existing_user:
            print("Cleaning up old test user from database...")
            await user_repo.remove(existing_user.id)
            await db.commit()
            
        test_user = User(
            phone_number=test_phone,
            email=test_email,
            password_hash="hashed_test_password_123",
            full_name="Crop Tester",
            preferred_lang="en"
        )
        await user_repo.create(test_user)
        await db.commit()
        await db.refresh(test_user)
        print(f"Test User Created. ID: {test_user.id}")

        # 2. Setup Test Farm Segment
        print("\n[Step 2] Registering farm segment...")
        test_farm = Farm(
            user_id=test_user.id,
            name="Testing Orchard",
            location_name="Guntur District, Andhra Pradesh",
            latitude=16.3067,
            longitude=80.4365,
            acreage=5.50,
            soil_type="Black Cotton"
        )
        await farm_repo.create(test_farm)
        await db.commit()
        await db.refresh(test_farm)
        print(f"Test Farm Registered. ID: {test_farm.id}")

        # 3. Create Crop Lifecycle
        print("\n[Step 3] Sowing a new crop cycle...")
        sow_date = date.today()
        harvest_date = sow_date + timedelta(days=120) # 4 months lifecycle
        
        new_crop = Crop(
            farm_id=test_farm.id,
            name="Cotton",
            variety="Bt Cotton II",
            sowing_date=sow_date,
            expected_harvest_date=harvest_date,
            stage="SOWING",
            status="ACTIVE"
        )
        await crop_repo.create(new_crop)
        await db.commit()
        await db.refresh(new_crop)
        print(f"Crop Sown Successfully! Name: {new_crop.name}, Variety: {new_crop.variety}")
        print(f"Sowing Date: {new_crop.sowing_date}, Est. Harvest: {new_crop.expected_harvest_date}")
        assert new_crop.stage == "SOWING", "Crop stage should default to SOWING"
        assert new_crop.status == "ACTIVE", "Crop status should default to ACTIVE"

        # 4. Read & Verify Crop
        print("\n[Step 4] Querying crop logs...")
        fetched_crop = await crop_repo.get(new_crop.id)
        assert fetched_crop is not None, "Failed to retrieve crop by ID"
        print(f"Verified Crop ID matches database entity. Sown stage: {fetched_crop.stage}")

        # 5. Fetch Multi Crops by Farm ID
        farm_crops = await crop_repo.get_multi_by_farm(test_farm.id)
        print(f"Total crops registered under farm: {len(farm_crops)}")
        assert len(farm_crops) == 1, "Should return exactly 1 crop under this farm"

        # 6. Update Crop Timeline Stage
        print("\n[Step 5] Advancing crop timeline stage...")
        # Transition stage: SOWING -> VEGETATIVE -> FLOWERING -> HARVEST_READY -> HARVESTED
        stages_to_test = ["VEGETATIVE", "FLOWERING", "HARVEST_READY"]
        for stage in stages_to_test:
            print(f"Transitioning to: {stage} stage...")
            await crop_repo.update(fetched_crop, {"stage": stage})
            await db.commit()
            await db.refresh(fetched_crop)
            assert fetched_crop.stage == stage, f"Failed to update stage to {stage}"
            
        print("Timeline stages successfully updated!")

        # 7. Complete Crop Cycle
        print("\n[Step 6] Completing crop harvest...")
        await crop_repo.update(fetched_crop, {"stage": "HARVESTED", "status": "COMPLETED"})
        await db.commit()
        await db.refresh(fetched_crop)
        print(f"Crop Cycle Completed. New Stage: {fetched_crop.stage}, Status: {fetched_crop.status}")
        assert fetched_crop.stage == "HARVESTED", "Crop should be Harvested"
        assert fetched_crop.status == "COMPLETED", "Crop status should be Completed"

        # 8. Cleanup Database Resources
        print("\n[Step 7] Cleaning up database...")
        # Delete crop
        await crop_repo.remove(fetched_crop.id)
        # Delete farm
        await farm_repo.remove(test_farm.id)
        # Delete user
        await user_repo.remove(test_user.id)
        await db.commit()
        
        # Verify removal
        deleted_crop = await crop_repo.get(fetched_crop.id)
        assert deleted_crop is None, "Crop deletion failed"
        print("Cleanup Complete. Temporary test records successfully removed.")

    print("\nSUCCESS: All Crop Management Integration Tests Passed!")

if __name__ == "__main__":
    try:
        asyncio.run(test_crop_lifecycle())
    except AssertionError as ae:
        print(f"\nTEST FAILED (Assertion Error): {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\nTEST FAILED (Error): {e}")
        sys.exit(1)
