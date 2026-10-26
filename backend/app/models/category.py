import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True) # NULL for system defaults
    name = Column(String(80), nullable=False)
    slug = Column(String(80), nullable=False)
    icon = Column(String(50), default="tag", nullable=False)
    color = Column(String(20), default="#6366F1", nullable=False)
    category_type = Column(String(20), default="EXPENSE", nullable=False) # 'EXPENSE', 'INCOME', 'BOTH'
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
