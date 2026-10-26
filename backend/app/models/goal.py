import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Date, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False) # e.g. "MacBook Air Fund", "Emergency Buffer", "Trip to Goa"
    target_amount_paise = Column(BigInteger, nullable=False)
    current_amount_paise = Column(BigInteger, default=0, nullable=False)
    target_date = Column(Date, nullable=False)
    status = Column(String(20), default="IN_PROGRESS", nullable=False) # 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'ABANDONED'
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="savings_goals")
