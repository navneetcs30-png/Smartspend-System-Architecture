from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ParsedItemPreview(BaseModel):
    temp_id: str
    date: str
    amount_inr: float
    transaction_type: str # 'EXPENSE', 'INCOME', 'REFUND', 'TRANSFER'
    description: str
    merchant_name: Optional[str] = None
    suggested_category_id: Optional[str] = None
    suggested_category_name: Optional[str] = None
    confidence_score: float # 0.0 to 1.0
    payment_method: str = "UPI"
    payment_source: str = "PAYTM"
    reference_utr: Optional[str] = None
    is_duplicate: bool = False

class ImportPreviewResponse(BaseModel):
    file_name: str
    source_type: str
    total_found: int
    duplicate_count: int
    new_count: int
    items: List[ParsedItemPreview]

class ImportConfirmItem(BaseModel):
    amount_inr: float
    transaction_type: str = "EXPENSE"
    transaction_date: datetime
    description: str
    merchant_name: Optional[str] = None
    category_id: Optional[str] = None
    payment_method: str = "UPI"
    payment_source: Optional[str] = None
    reference_utr: Optional[str] = None
    notes: Optional[str] = None

class ImportConfirmRequest(BaseModel):
    source_type: str
    file_name: str
    items: List[ImportConfirmItem]

class ImportJobOut(BaseModel):
    id: str
    source_type: str
    file_name: Optional[str] = None
    total_records: int
    imported_records: int
    duplicate_records: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
