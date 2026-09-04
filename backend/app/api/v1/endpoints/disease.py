import os
import uuid
import base64
import json
from typing import Any, List, Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.crop import Crop
from app.models.farm import Farm
from app.models.expense import Expense
from app.models.disease import DiseaseHistory
from app.models.logs import FertilizerHistory
from app.schemas.disease import (
    DiseaseDetectionResponse,
    DiseaseExpenseCreate,
    DiseaseHistoryResponse,
    TreatmentOption
)
from app.ml.services.disease_detection_service import DiseaseDetectionService

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../uploads/disease_images"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/detect", response_model=DiseaseDetectionResponse)
async def detect_crop_disease(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    crop_id: Optional[UUID] = Form(None),
    farm_id: Optional[UUID] = Form(None),
    crop_name: Optional[str] = Form(None),
    growth_stage: Optional[str] = Form(None),
    soil_type: Optional[str] = Form(None),
    previous_fertilizer: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Diagnose crop leaf disease from camera capture or uploaded image.
    Provides farmer-friendly multi-treatment recommendations and stores diagnosis in Disease History.
    """
    image_bytes: Optional[bytes] = None
    file_ext = ".jpg"

    if file and file.filename:
        image_bytes = await file.read()
        _, ext = os.path.splitext(file.filename)
        if ext:
            file_ext = ext
    elif image_base64:
        try:
            # Handle data:image/jpeg;base64,...
            if "," in image_base64:
                header, encoded = image_base64.split(",", 1)
                if "png" in header:
                    file_ext = ".png"
                elif "webp" in header:
                    file_ext = ".webp"
            else:
                encoded = image_base64
            image_bytes = base64.b64decode(encoded)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid base64 image data: {str(e)}"
            )

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No leaf image provided. Please take a photo or upload an image file."
        )

    # Save image file to local uploads directory
    saved_filename = f"{uuid.uuid4().hex}{file_ext}"
    saved_filepath = os.path.join(UPLOAD_DIR, saved_filename)
    try:
        with open(saved_filepath, "wb") as f:
            f.write(image_bytes)
        relative_image_url = f"/uploads/disease_images/{saved_filename}"
    except Exception as e:
        relative_image_url = None

    # Context resolution from DB if crop_id is supplied
    resolved_crop_name = crop_name
    resolved_stage = growth_stage
    resolved_soil = soil_type
    resolved_prev_fert = previous_fertilizer
    target_crop = None
    target_farm = None

    if crop_id:
        target_crop = await db.get(Crop, crop_id)
        if target_crop:
            if not resolved_crop_name:
                resolved_crop_name = target_crop.name
            if not resolved_stage:
                resolved_stage = target_crop.stage
            if not farm_id:
                farm_id = target_crop.farm_id

            # Verify ownership
            target_farm = await db.get(Farm, target_crop.farm_id)
            if target_farm and target_farm.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions to access this crop."
                )
            if target_farm and not resolved_soil:
                resolved_soil = target_farm.soil_type

            # Check previous fertilizer history
            if not resolved_prev_fert:
                fert_query = select(FertilizerHistory).where(
                    FertilizerHistory.crop_id == crop_id
                ).order_by(FertilizerHistory.application_date.desc()).limit(2)
                fert_res = await db.execute(fert_query)
                past_ferts = fert_res.scalars().all()
                if past_ferts:
                    resolved_prev_fert = ", ".join([f"{f.fertilizer_name} ({f.quantity_kg}kg)" for f in past_ferts])

    # Run AI Leaf Diagnosis
    try:
        analysis = DiseaseDetectionService.analyze_leaf(
            image_bytes=image_bytes,
            crop_name=resolved_crop_name,
            growth_stage=resolved_stage,
            soil_type=resolved_soil,
            previous_fertilizer=resolved_prev_fert
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in Disease Detection engine: {str(e)}"
        )

    # Save to DiseaseHistory if crop_id and farm_id are provided
    history_record = None
    if crop_id and farm_id:
        treatment_json = json.dumps(analysis["recommendations"])
        history_record = DiseaseHistory(
            crop_id=crop_id,
            farm_id=farm_id,
            crop_name=analysis["crop_name"],
            growth_stage=resolved_stage,
            soil_type=resolved_soil,
            previous_fertilizer=resolved_prev_fert,
            image_path=relative_image_url,
            disease_name=analysis["disease_name"],
            confidence=analysis["confidence"],
            symptoms=analysis["symptoms"],
            possible_cause=analysis["possible_cause"],
            treatment_recommendations=treatment_json,
            approx_quantity=analysis["approx_quantity"],
            approx_cost=analysis["approx_cost"],
            safety_instructions=analysis["safety_instructions"],
            diagnosis_date=date.today()
        )
        db.add(history_record)
        await db.commit()
        await db.refresh(history_record)

    return {
        "id": history_record.id if history_record else None,
        "crop_name": analysis["crop_name"],
        "disease_name": analysis["disease_name"],
        "confidence": analysis["confidence"],
        "confidence_percentage": analysis["confidence_percentage"],
        "symptoms": analysis["symptoms"],
        "possible_cause": analysis["possible_cause"],
        "recommendations": analysis["recommendations"],
        "approx_quantity": analysis["approx_quantity"],
        "approx_cost": analysis["approx_cost"],
        "safety_instructions": analysis["safety_instructions"],
        "diagnosis_date": date.today(),
        "image_url": relative_image_url,
        "disclaimer": analysis["disclaimer"],
        "crop_id": crop_id,
        "farm_id": farm_id
    }

@router.get("/history", response_model=List[DiseaseHistoryResponse])
async def read_disease_history(
    crop_id: Optional[UUID] = None,
    farm_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve disease diagnosis history throughout crop lifecycle.
    """
    # Fetch all farms of user to verify ownership
    user_farms_query = select(Farm).where(Farm.user_id == current_user.id)
    user_farms_res = await db.execute(user_farms_query)
    user_farms = user_farms_res.scalars().all()
    farm_ids = [f.id for f in user_farms]

    if not farm_ids:
        return []

    query = select(DiseaseHistory).where(DiseaseHistory.farm_id.in_(farm_ids))

    if farm_id:
        if farm_id not in farm_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to access disease history for this farm."
            )
        query = query.where(DiseaseHistory.farm_id == farm_id)

    if crop_id:
        query = query.where(DiseaseHistory.crop_id == crop_id)

    query = query.order_by(DiseaseHistory.created_at.desc()).offset(skip).limit(limit)
    res = await db.execute(query)
    records = res.scalars().all()

    output = []
    for r in records:
        recs = []
        if r.treatment_recommendations:
            try:
                raw_recs = json.loads(r.treatment_recommendations)
                recs = [TreatmentOption(**item) for item in raw_recs]
            except Exception:
                recs = []

        confidence_pct = f"{int(round(r.confidence * 100))}%"
        output.append(DiseaseHistoryResponse(
            id=r.id,
            crop_id=r.crop_id,
            farm_id=r.farm_id,
            crop_name=r.crop_name,
            growth_stage=r.growth_stage,
            soil_type=r.soil_type,
            previous_fertilizer=r.previous_fertilizer,
            image_path=r.image_path,
            disease_name=r.disease_name,
            confidence=r.confidence,
            confidence_percentage=confidence_pct,
            symptoms=r.symptoms,
            possible_cause=r.possible_cause,
            treatment_recommendations=recs,
            approx_quantity=r.approx_quantity,
            approx_cost=r.approx_cost,
            safety_instructions=r.safety_instructions,
            diagnosis_date=r.diagnosis_date,
            expense_id=r.expense_id,
            fertilizer_purchased=r.fertilizer_purchased,
            quantity_purchased=r.quantity_purchased,
            expense_amount=float(r.expense_amount) if r.expense_amount is not None else None,
            expense_date=r.expense_date,
            created_at=r.created_at
        ))

    return output

@router.get("/history/{id}", response_model=DiseaseHistoryResponse)
async def read_disease_history_item(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get a single disease diagnosis log by ID.
    """
    record = await db.get(DiseaseHistory, id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disease history record not found."
        )

    farm = await db.get(Farm, record.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this record."
        )

    recs = []
    if record.treatment_recommendations:
        try:
            raw_recs = json.loads(record.treatment_recommendations)
            recs = [TreatmentOption(**item) for item in raw_recs]
        except Exception:
            recs = []

    confidence_pct = f"{int(round(record.confidence * 100))}%"
    return DiseaseHistoryResponse(
        id=record.id,
        crop_id=record.crop_id,
        farm_id=record.farm_id,
        crop_name=record.crop_name,
        growth_stage=record.growth_stage,
        soil_type=record.soil_type,
        previous_fertilizer=record.previous_fertilizer,
        image_path=record.image_path,
        disease_name=record.disease_name,
        confidence=record.confidence,
        confidence_percentage=confidence_pct,
        symptoms=record.symptoms,
        possible_cause=record.possible_cause,
        treatment_recommendations=recs,
        approx_quantity=record.approx_quantity,
        approx_cost=record.approx_cost,
        safety_instructions=record.safety_instructions,
        diagnosis_date=record.diagnosis_date,
        expense_id=record.expense_id,
        fertilizer_purchased=record.fertilizer_purchased,
        quantity_purchased=record.quantity_purchased,
        expense_amount=float(record.expense_amount) if record.expense_amount is not None else None,
        expense_date=record.expense_date,
        created_at=record.created_at
    )

@router.post("/history/{history_id}/add-expense")
@router.post("/add-expense")
async def add_treatment_to_crop_expenses(
    expense_in: DiseaseExpenseCreate,
    history_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Log purchased fertilizer/treatment directly into the crop's expenses.
    Automatically updates the disease diagnosis record and overall farm financial investment.
    """
    farm = await db.get(Farm, expense_in.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot add expense to a farm that does not belong to you."
        )

    crop = await db.get(Crop, expense_in.crop_id)
    if not crop or crop.farm_id != farm.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target crop not found on this farm."
        )

    # Determine category: PESTICIDES or FERTILIZERS
    cat = "PESTICIDES"
    fn_lower = expense_in.fertilizer_name.lower()
    if "fertilizer" in fn_lower or "potash" in fn_lower or "urea" in fn_lower or "npk" in fn_lower or "zinc" in fn_lower:
        cat = "FERTILIZERS"

    description = f"Disease Treatment: {expense_in.fertilizer_name} ({expense_in.quantity})"
    if expense_in.notes:
        description += f" - {expense_in.notes}"

    # 1. Create Expense record
    new_expense = Expense(
        farm_id=expense_in.farm_id,
        crop_id=expense_in.crop_id,
        category=cat,
        amount=expense_in.amount_spent,
        description=description,
        transaction_date=expense_in.purchase_date
    )
    db.add(new_expense)
    await db.flush()
    await db.refresh(new_expense)

    # 2. Update DiseaseHistory if history_id is provided
    if history_id:
        history_record = await db.get(DiseaseHistory, history_id)
        if history_record and history_record.farm_id == farm.id:
            history_record.expense_id = new_expense.id
            history_record.fertilizer_purchased = expense_in.fertilizer_name
            history_record.quantity_purchased = expense_in.quantity
            history_record.expense_amount = expense_in.amount_spent
            history_record.expense_date = expense_in.purchase_date
            db.add(history_record)

    await db.commit()

    return {
        "status": "success",
        "message": f"Successfully added ₹{expense_in.amount_spent:.2f} for '{expense_in.fertilizer_name}' to {crop.name} expenses.",
        "expense_id": new_expense.id,
        "crop_id": crop.id,
        "amount": float(new_expense.amount),
        "transaction_date": new_expense.transaction_date.isoformat()
    }

@router.delete("/history/{id}", status_code=status.HTTP_200_OK)
async def delete_disease_history_item(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete a disease diagnosis record from history.
    """
    record = await db.get(DiseaseHistory, id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Disease history record not found."
        )

    farm = await db.get(Farm, record.farm_id)
    if not farm or farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this record."
        )

    await db.delete(record)
    await db.commit()

    return {"status": "success", "message": "Disease history record deleted."}
