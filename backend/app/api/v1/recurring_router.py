from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.recurring_service import RecurringService
from app.schemas.recurring import RecurringCreate, RecurringOut

router = APIRouter(prefix="/recurring", tags=["Recurring Expenses & Subscriptions"])

@router.post("", response_model=RecurringOut, status_code=status.HTTP_201_CREATED)
async def create_recurring(
    data: RecurringCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await RecurringService.create_recurring(db=db, user_id=current_user.id, data=data)

@router.get("", response_model=List[RecurringOut])
async def list_recurring(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await RecurringService.get_recurring_list(db=db, user_id=current_user.id)

@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recurring(
    rec_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await RecurringService.delete_recurring(db=db, user_id=current_user.id, rec_id=rec_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring expense not found.")
    return None
