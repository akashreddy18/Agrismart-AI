import uuid
from datetime import datetime, date
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Date, Text, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Expense(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farm.id", ondelete="CASCADE"), nullable=False
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("crop.id", ondelete="SET NULL"), nullable=True
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False  # SEEDS, FERTILIZERS, PESTICIDES, LABOUR, TRACTOR, DIESEL, IRRIGATION, TRANSPORT, OTHER
    )
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    description: Mapped[str] = mapped_column(
        Text, nullable=True
    )
    hours: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    rate_per_hour: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    equipment_name: Mapped[str] = mapped_column(
        String(100), nullable=True
    )
    transaction_date: Mapped[date] = mapped_column(
        Date, default=date.today
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="expenses")
    crop: Mapped["Crop"] = relationship("Crop", back_populates="expenses")
