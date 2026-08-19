import uuid
from datetime import datetime, date
from typing import List
from sqlalchemy import String, Date, ForeignKey, DateTime, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Crop(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farm.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    variety: Mapped[str] = mapped_column(
        String(100), nullable=True
    )
    sowing_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    expected_harvest_date: Mapped[date] = mapped_column(
        Date, nullable=False
    )
    stage: Mapped[str] = mapped_column(
        String(50), default="SOWING"  # e.g., SOWING, VEGETATIVE, FLOWERING, HARVEST_READY, HARVESTED
    )
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE"  # e.g., ACTIVE, COMPLETED, FAILED
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="crops")
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="crop", cascade="all, delete-orphan"
    )
    fertilizer_history: Mapped[List["FertilizerHistory"]] = relationship(
        "FertilizerHistory", back_populates="crop", cascade="all, delete-orphan"
    )
    irrigation_history: Mapped[List["IrrigationHistory"]] = relationship(
        "IrrigationHistory", back_populates="crop", cascade="all, delete-orphan"
    )
    sales: Mapped[List["Sales"]] = relationship(
        "Sales", back_populates="crop", cascade="all, delete-orphan"
    )
