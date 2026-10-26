from pydantic import BaseModel, Field
from typing import Optional, List

class BudgetCreate(BaseModel):
    category_id: Optional[str] = None # None means overall monthly budget
    period: str = "MONTHLY" # 'MONTHLY', 'WEEKLY', 'YEARLY'
    limit_amount_inr: float = Field(..., gt=0)
    alert_at_50: bool = True
    alert_at_75: bool = True
    alert_at_90: bool = True
    alert_at_100: bool = True

class BudgetUpdate(BaseModel):
    limit_amount_inr: Optional[float] = Field(default=None, gt=0)
    alert_at_50: Optional[bool] = None
    alert_at_75: Optional[bool] = None
    alert_at_90: Optional[bool] = None
    alert_at_100: Optional[bool] = None
    is_active: Optional[bool] = None

class BudgetProgressOut(BaseModel):
    id: str
    category_id: Optional[str] = None
    category_name: str
    category_icon: str
    category_color: str
    period: str
    limit_amount_inr: float
    spent_amount_inr: float
    remaining_amount_inr: float
    percentage_used: float
    days_remaining: int
    projected_eom_spend_inr: float
    alert_level: str # 'NORMAL', 'WARNING_75', 'CRITICAL_90', 'EXCEEDED'
    is_active: bool

class BudgetOverviewResponse(BaseModel):
    total_budgeted_inr: float
    total_spent_inr: float
    overall_remaining_inr: float
    overall_percentage: float
    budgets: List[BudgetProgressOut]
