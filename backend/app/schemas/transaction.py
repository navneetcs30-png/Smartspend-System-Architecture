from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.category import CategoryOut

class TransactionCreate(BaseModel):
    amount_inr: float = Field(..., gt=0, description="Amount in Indian Rupees (e.g. 350.00)")
    transaction_type: str = Field(default="EXPENSE", description="'INCOME', 'EXPENSE', 'REFUND', 'TRANSFER'")
    transaction_date: datetime
    description: str = Field(..., min_length=1, max_length=500)
    merchant_name: Optional[str] = None
    category_id: Optional[str] = None
    account_id: Optional[str] = None
    destination_account_id: Optional[str] = None # Mandatory if transaction_type == 'TRANSFER'
    payment_method: str = "UPI" # 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NETBANKING', 'CASH'
    payment_source: Optional[str] = None # 'PAYTM', 'PHONEPE', 'GPAY', etc.
    reference_utr: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = ""

class TransactionUpdate(BaseModel):
    amount_inr: Optional[float] = Field(default=None, gt=0)
    transaction_type: Optional[str] = None
    transaction_date: Optional[datetime] = None
    description: Optional[str] = None
    merchant_name: Optional[str] = None
    category_id: Optional[str] = None
    account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    payment_method: Optional[str] = None
    payment_source: Optional[str] = None
    reference_utr: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    verification_status: Optional[str] = None

class TransactionOut(BaseModel):
    id: str
    user_id: str
    amount_paise: int
    amount_inr: float
    transaction_type: str
    transaction_date: datetime
    description: str
    merchant_name: Optional[str] = None
    category_id: Optional[str] = None
    category: Optional[CategoryOut] = None
    account_id: Optional[str] = None
    destination_account_id: Optional[str] = None
    payment_method: str
    payment_source: Optional[str] = None
    reference_utr: Optional[str] = None
    deduplication_hash: str
    verification_status: str
    notes: Optional[str] = None
    tags: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    limit: int
    pages: int
    total_income_inr: float
    total_expense_inr: float
    net_savings_inr: float
