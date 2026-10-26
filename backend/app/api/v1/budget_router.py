from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.budget_service import BudgetService
from app.schemas.budget import BudgetCreate, BudgetOverviewResponse

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    b = await BudgetService.create_budget(db=db, user_id=current_user.id, data=data)
    return {"message": "Budget created successfully", "budget_id": b.id}

@router.get("/progress", response_model=BudgetOverviewResponse)
async def get_budgets_progress(
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await BudgetService.get_budgets_progress(
        db=db,
        user_id=current_user.id,
        year=year,
        month=month
    )

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await BudgetService.delete_budget(db=db, user_id=current_user.id, budget_id=budget_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")
    return None
