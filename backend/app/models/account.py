import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False) # e.g. "Paytm Wallet", "HDFC Salary Account", "PhonePe / UPI"
    account_type = Column(String(30), nullable=False) # 'BANK', 'WALLET', 'CREDIT_CARD', 'CASH'
    institution_name = Column(String(100), nullable=True) # e.g. 'Paytm', 'HDFC Bank', 'State Bank of India'
    mask_account_number = Column(String(10), nullable=True) # e.g. 'XX4912'
    current_balance_paise = Column(BigInteger, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", foreign_keys="Transaction.account_id")
