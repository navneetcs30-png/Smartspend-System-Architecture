import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Date, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    merchant_name = Column(String(150), nullable=False) # e.g. "Netflix India", "JioFiber", "Cult.fit"
    expected_amount_paise = Column(BigInteger, nullable=False)
    frequency = Column(String(20), default="MONTHLY", nullable=False) # 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
    next_due_date = Column(Date, nullable=False)
    importance = Column(String(20), default="ESSENTIAL", nullable=False) # 'ESSENTIAL', 'OPTIONAL', 'LUXURY'
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="recurring_expenses")
    category = relationship("Category")
