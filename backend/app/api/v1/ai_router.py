from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.ai_analyst_service import AIAnalystService
from app.schemas.ai import AIChatRequest, AIChatResponse, SpendingInsightOut

router = APIRouter(prefix="/ai", tags=["AI Spending Analyst"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_analyst(
    data: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AIAnalystService.process_chat_query(
        db=db,
        user_id=current_user.id,
        message=data.message
    )

@router.get("/insights", response_model=List[SpendingInsightOut])
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AIAnalystService.get_active_insights(
        db=db,
        user_id=current_user.id
    )
