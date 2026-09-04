import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Numeric, ForeignKey, Date, DateTime, Text, Float, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class DiseaseHistory(Base):
    __tablename__ = "disease_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("crop.id", ondelete="CASCADE"), nullable=False
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farm.id", ondelete="CASCADE"), nullable=False
    )
    crop_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    growth_stage: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    soil_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    previous_fertilizer: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True
    )
    image_path: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    disease_name: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False
    )
    symptoms: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    possible_cause: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    treatment_recommendations: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True  # Stored as JSON string
    )
    approx_quantity: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    approx_cost: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    safety_instructions: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )
    diagnosis_date: Mapped[date] = mapped_column(
        Date, default=date.today
    )
    expense_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expense.id", ondelete="SET NULL"), nullable=True
    )
    fertilizer_purchased: Mapped[Optional[str]] = mapped_column(
        String(150), nullable=True
    )
    quantity_purchased: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    expense_amount: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    expense_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    # Relationships
    crop: Mapped["Crop"] = relationship("Crop", back_populates="disease_history")
    farm: Mapped["Farm"] = relationship("Farm")
    expense: Mapped[Optional["Expense"]] = relationship("Expense")
