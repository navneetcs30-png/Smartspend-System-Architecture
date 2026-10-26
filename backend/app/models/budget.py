import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Boolean, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), nullable=True) # NULL means Overall Monthly Budget
    period = Column(String(20), default="MONTHLY", nullable=False) # 'MONTHLY', 'WEEKLY', 'YEARLY'
    limit_amount_paise = Column(BigInteger, nullable=False)
    
    alert_at_50 = Column(Boolean, default=True, nullable=False)
    alert_at_75 = Column(Boolean, default=True, nullable=False)
    alert_at_90 = Column(Boolean, default=True, nullable=False)
    alert_at_100 = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

    __table_args__ = (
        Index("idx_user_budget_cat", "user_id", "category_id", "period"),
    )
