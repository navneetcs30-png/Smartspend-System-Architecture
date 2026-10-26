import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Text, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    destination_account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True) # Used only when transaction_type = 'TRANSFER'
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    import_job_id = Column(String(36), ForeignKey("import_jobs.id", ondelete="SET NULL"), nullable=True)

    amount_paise = Column(BigInteger, nullable=False) # In Paise (100 Paise = 1 INR)
    transaction_type = Column(String(20), default="EXPENSE", nullable=False) # 'INCOME', 'EXPENSE', 'REFUND', 'TRANSFER'
    transaction_date = Column(DateTime(timezone=True), nullable=False)

    description = Column(String(500), nullable=False)
    merchant_name = Column(String(150), nullable=True)
    payment_method = Column(String(50), default="UPI", nullable=False) # 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NETBANKING', 'CASH'
    payment_source = Column(String(50), nullable=True) # 'PAYTM', 'PHONEPE', 'GPAY', 'CRED', 'BHIM', 'DIRECT'
    reference_utr = Column(String(100), nullable=True) # UPI Reference / UTR / Order ID

    deduplication_hash = Column(String(64), nullable=False, index=True) # Unique per user
    verification_status = Column(String(20), default="VERIFIED", nullable=False) # 'UNVERIFIED', 'VERIFIED', 'FLAGGED'

    notes = Column(Text, nullable=True)
    tags = Column(String(255), default="", nullable=True) # Comma-separated tags e.g. "college,exam,food"

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="transactions", foreign_keys=[user_id])
    account = relationship("Account", foreign_keys=[account_id], back_populates="transactions")
    destination_account = relationship("Account", foreign_keys=[destination_account_id])
    category = relationship("Category", back_populates="transactions", lazy="selectin")
    import_job = relationship("ImportJob", back_populates="transactions")

    __table_args__ = (
        Index("idx_user_txn_date", "user_id", "transaction_date"),
        Index("idx_user_txn_dedup", "user_id", "deduplication_hash"),
    )
