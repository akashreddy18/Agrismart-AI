import uuid
from datetime import datetime, date
from sqlalchemy import String, Numeric, ForeignKey, Integer, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class TractorConfig(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farm.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    diesel_price: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    mileage_liters_per_hour: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    driver_charge_per_hour: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    maintenance_cost_per_hour: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    calculated_cost_per_hour: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, default=0.0
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="tractor_config")


class FertilizerHistory(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("crop.id", ondelete="CASCADE"), nullable=False
    )
    fertilizer_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    quantity_kg: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    cost: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    application_date: Mapped[date] = mapped_column(
        Date, default=date.today
    )

    # Relationships
    crop: Mapped["Crop"] = relationship("Crop", back_populates="fertilizer_history")


class IrrigationHistory(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("crop.id", ondelete="CASCADE"), nullable=False
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    water_consumed_liters: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    cost: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    irrigation_date: Mapped[date] = mapped_column(
        Date, default=date.today
    )

    # Relationships
    crop: Mapped["Crop"] = relationship("Crop", back_populates="irrigation_history")
