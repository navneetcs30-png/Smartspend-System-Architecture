import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False) # 'TXN_CREATE', 'TXN_UPDATE', 'TXN_DELETE', 'IMPORT_STATEMENT'
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    old_values = Column(Text, nullable=True) # JSON encoded
    new_values = Column(Text, nullable=True) # JSON encoded
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
