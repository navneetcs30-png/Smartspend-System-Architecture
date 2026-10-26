from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CategorySpendItem(BaseModel):
    category_id: Optional[str]
    category_name: str
    color: str
    icon: str
    total_paise: int
    total_inr: float
    percentage: float
    count: int

class DailySpendTrendItem(BaseModel):
    date: str # 'YYYY-MM-DD'
    day_label: str # 'Mon 26'
    expense_inr: float
    income_inr: float
    net_inr: float

class PaymentMethodBreakdown(BaseModel):
    method: str
    total_inr: float
    count: int
    percentage: float

class DashboardSummaryResponse(BaseModel):
    period_label: str # e.g. "October 2026"
    total_income_inr: float
    total_expenses_inr: float
    net_savings_inr: float
    savings_rate: float # Percentage 0 - 100%
    remaining_monthly_budget_inr: Optional[float]
    total_monthly_budget_inr: Optional[float]
    budget_usage_percent: Optional[float]
    transaction_count: int
    largest_expense_inr: float
    largest_expense_merchant: Optional[str]
    avg_daily_spending_inr: float
    
    # Visualizations data
    daily_trends: List[DailySpendTrendItem]
    category_breakdown: List[CategorySpendItem]
    payment_method_breakdown: List[PaymentMethodBreakdown]

class DailyReportResponse(BaseModel):
    date: str
    total_income_inr: float
    total_expenses_inr: float
    net_cashflow_inr: float
    transaction_count: int
    largest_transaction_inr: float
    remaining_daily_budget_inr: Optional[float]
    categories: List[CategorySpendItem]
    transactions: List[Any]

class MonthlyReportResponse(BaseModel):
    month: int
    year: int
    total_income_inr: float
    total_expenses_inr: float
    total_savings_inr: float
    savings_rate: float
    budget_limit_inr: Optional[float]
    budget_spent_inr: float
    budget_utilization_percent: float
    prev_month_expenses_inr: float
    month_on_month_change_percent: float
    categories: List[CategorySpendItem]
    daily_trend: List[DailySpendTrendItem]
    avoidable_spends_inr: float
    unusual_spends_count: int

class YearlyReportResponse(BaseModel):
    year: int
    total_income_inr: float
    total_expenses_inr: float
    total_savings_inr: float
    annual_savings_rate: float
    highest_spending_month: Optional[str]
    lowest_spending_month: Optional[str]
    monthly_comparison: List[Dict[str, Any]]
    category_annual_breakdown: List[CategorySpendItem]
