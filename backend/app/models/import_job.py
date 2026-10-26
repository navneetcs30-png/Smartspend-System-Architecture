import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(50), nullable=False) # 'PAYTM_CSV', 'PHONEPE_CSV', 'GENERIC_BANK_CSV', 'MANUAL'
    file_name = Column(String(255), nullable=True)
    total_records = Column(Integer, default=0, nullable=False)
    imported_records = Column(Integer, default=0, nullable=False)
    duplicate_records = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="COMPLETED", nullable=False) # 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="import_jobs")
    transactions = relationship("Transaction", back_populates="import_job")
