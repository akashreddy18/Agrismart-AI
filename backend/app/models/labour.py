import uuid
from datetime import date
from sqlalchemy import String, Numeric, ForeignKey, Integer, Date, Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Labour(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    farm_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farm.id", ondelete="CASCADE"), nullable=False
    )
    worker_name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    work_type: Mapped[str] = mapped_column(
        String(100), nullable=False  # Sowing, Weeding, Harvesting, etc.
    )
    days_worked: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1
    )
    daily_wage: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    total_cost: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    recorded_date: Mapped[date] = mapped_column(
        Date, default=date.today
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="labours")
