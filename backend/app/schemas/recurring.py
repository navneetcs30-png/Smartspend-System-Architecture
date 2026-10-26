from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class RecurringCreate(BaseModel):
    merchant_name: str = Field(..., min_length=2, max_length=150)
    expected_amount_inr: float = Field(..., gt=0)
    frequency: str = "MONTHLY" # 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'
    next_due_date: date
    importance: str = "ESSENTIAL" # 'ESSENTIAL', 'OPTIONAL', 'LUXURY'
    category_id: Optional[str] = None

class RecurringUpdate(BaseModel):
    merchant_name: Optional[str] = None
    expected_amount_inr: Optional[float] = Field(default=None, gt=0)
    frequency: Optional[str] = None
    next_due_date: Optional[date] = None
    importance: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[str] = None

class RecurringOut(BaseModel):
    id: str
    merchant_name: str
    expected_amount_inr: float
    frequency: str
    yearly_cost_inr: float
    next_due_date: date
    days_until_due: int
    importance: str
    is_active: bool
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
