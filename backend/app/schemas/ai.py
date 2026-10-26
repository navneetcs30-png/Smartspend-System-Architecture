from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIChatRequest(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    response: str
    suggested_actions: List[str] = []
    structured_metrics: Optional[Dict[str, Any]] = None

class SpendingInsightOut(BaseModel):
    id: str
    insight_type: str
    title: str
    description: str
    potential_savings_inr: float
    evidence_data: Dict[str, Any]
    is_dismissed: bool
    is_applied: bool
    created_at: datetime

    class Config:
        from_attributes = True
