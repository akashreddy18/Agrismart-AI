import uuid
from datetime import date
from sqlalchemy import String, Numeric, ForeignKey, Date, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Sales(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    crop_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("crop.id", ondelete="CASCADE"), nullable=False
    )
    quantity_kg: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    price_per_kg: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    buyer_name: Mapped[str] = mapped_column(
        String(150), nullable=True
    )
    transport_cost: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False, default=0.0
    )
    total_income: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    net_income: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    roi: Mapped[float] = mapped_column(
        Numeric(5, 2), nullable=False  # Percentage representation, e.g., 25.5 for 25.5%
    )
    sale_date: Mapped[date] = mapped_column(
        Date, default=date.today
    )

    # Relationships
    crop: Mapped["Crop"] = relationship("Crop", back_populates="sales")
