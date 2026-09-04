from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field

class TreatmentOption(BaseModel):
    name: str = Field(..., description="Product or treatment name")
    category: str = Field(..., description="Treatment category (e.g., Chemical, Organic/Bio, Nutrient Management, Cultural)")
    dosage: str = Field(..., description="Recommended dosage and application method")
    approx_quantity: str = Field(..., description="Estimated quantity required per acre")
    approx_cost: str = Field(..., description="Estimated cost in INR")
    instructions: str = Field(..., description="Application instructions and timing")

class DiseaseDetectionResponse(BaseModel):
    id: Optional[UUID] = None
    crop_name: str = Field(..., description="Identified or specified crop")
    disease_name: str = Field(..., description="Detected disease or plant health issue")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    confidence_percentage: str = Field(..., description="Formatted confidence percentage (e.g., '92%')")
    symptoms: str = Field(..., description="Symptoms identified on the plant or leaf")
    possible_cause: str = Field(..., description="Possible biological or environmental causes")
    recommendations: List[TreatmentOption] = Field(default_factory=list, description="Multiple suitable treatment options")
    approx_quantity: Optional[str] = Field(None, description="General approximate quantity")
    approx_cost: Optional[str] = Field(None, description="General approximate cost")
    safety_instructions: str = Field(..., description="Farmer safety and chemical usage instructions")
    diagnosis_date: date = Field(default_factory=date.today, description="Date of diagnosis")
    image_url: Optional[str] = Field(None, description="URL or data URL to view the uploaded image")
    disclaimer: str = Field(
        default="AI detection is an advisory recommendation. Serious or uncertain crop cases must be verified with a qualified agricultural officer or local Krishi Vigyan Kendra (KVK) scientist before applying treatment.",
        description="Mandatory agricultural officer disclaimer"
    )
    crop_id: Optional[UUID] = None
    farm_id: Optional[UUID] = None

class DiseaseExpenseCreate(BaseModel):
    fertilizer_name: str = Field(..., description="Purchased fertilizer/treatment name")
    quantity: str = Field(..., description="Quantity purchased (e.g., '500 g' or '2.5 kg')")
    amount_spent: float = Field(..., ge=0, description="Total amount spent in INR")
    purchase_date: date = Field(default_factory=date.today, description="Date of purchase")
    crop_id: UUID = Field(..., description="Crop to associate the expense with")
    farm_id: UUID = Field(..., description="Farm the crop belongs to")
    notes: Optional[str] = Field(None, description="Additional notes")

class DiseaseHistoryResponse(BaseModel):
    id: UUID
    crop_id: UUID
    farm_id: UUID
    crop_name: str
    growth_stage: Optional[str] = None
    soil_type: Optional[str] = None
    previous_fertilizer: Optional[str] = None
    image_path: Optional[str] = None
    disease_name: str
    confidence: float
    confidence_percentage: str
    symptoms: Optional[str] = None
    possible_cause: Optional[str] = None
    treatment_recommendations: List[TreatmentOption] = Field(default_factory=list)
    approx_quantity: Optional[str] = None
    approx_cost: Optional[str] = None
    safety_instructions: Optional[str] = None
    diagnosis_date: date
    expense_id: Optional[UUID] = None
    fertilizer_purchased: Optional[str] = None
    quantity_purchased: Optional[str] = None
    expense_amount: Optional[float] = None
    expense_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True
