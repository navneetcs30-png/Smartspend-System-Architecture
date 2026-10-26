import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class SpendingInsight(Base):
    __tablename__ = "spending_insights"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    insight_type = Column(String(50), nullable=False) # 'WASTAGE_DETECTED', 'BUDGET_SPIKE', 'SUBSCRIPTION_REVIEW', 'SAVINGS_OPPORTUNITY'
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    potential_savings_paise = Column(BigInteger, default=0, nullable=False)
    evidence_data = Column(Text, default="{}", nullable=False) # JSON encoded evidence
    is_dismissed = Column(Boolean, default=False, nullable=False)
    is_applied = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="insights")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="BUDGET_ALERT", nullable=False) # 'BUDGET_ALERT', 'GOAL_MILESTONE', 'UNUSUAL_EXPENSE', 'SYSTEM'
    action_url = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="notifications")
