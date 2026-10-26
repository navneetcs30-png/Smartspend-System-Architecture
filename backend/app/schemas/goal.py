from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    target_amount_inr: float = Field(..., gt=0)
    current_amount_inr: float = Field(default=0.0, ge=0)
    target_date: date
    notes: Optional[str] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount_inr: Optional[float] = Field(default=None, gt=0)
    current_amount_inr: Optional[float] = Field(default=None, ge=0)
    target_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class GoalContribute(BaseModel):
    amount_inr: float = Field(..., gt=0)

class GoalOut(BaseModel):
    id: str
    title: str
    target_amount_inr: float
    current_amount_inr: float
    remaining_amount_inr: float
    progress_percentage: float
    target_date: date
    days_left: int
    monthly_savings_needed_inr: float
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
