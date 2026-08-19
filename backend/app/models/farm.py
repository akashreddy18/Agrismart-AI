import uuid
from datetime import datetime
from typing import List
from sqlalchemy import String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class Farm(Base):
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    location_name: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    latitude: Mapped[float] = mapped_column(
        Numeric(9, 6), nullable=False
    )
    longitude: Mapped[float] = mapped_column(
        Numeric(9, 6), nullable=False
    )
    acreage: Mapped[float] = mapped_column(
        Numeric(6, 2), nullable=False
    )
    soil_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="farms")
    crops: Mapped[List["Crop"]] = relationship(
        "Crop", back_populates="farm", cascade="all, delete-orphan"
    )
    expenses: Mapped[List["Expense"]] = relationship(
        "Expense", back_populates="farm", cascade="all, delete-orphan"
    )
    labours: Mapped[List["Labour"]] = relationship(
        "Labour", back_populates="farm", cascade="all, delete-orphan"
    )
    tractor_config: Mapped["TractorConfig"] = relationship(
        "TractorConfig", back_populates="farm", uselist=False, cascade="all, delete-orphan"
    )
