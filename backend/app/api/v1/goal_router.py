from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.goal_service import GoalService
from app.schemas.goal import GoalCreate, GoalContribute, GoalOut

router = APIRouter(prefix="/goals", tags=["Savings Goals"])

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await GoalService.create_goal(db=db, user_id=current_user.id, data=data)

@router.get("", response_model=List[GoalOut])
async def list_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await GoalService.get_goals(db=db, user_id=current_user.id)

@router.patch("/{goal_id}/contribute", response_model=GoalOut)
async def contribute_goal(
    goal_id: str,
    data: GoalContribute,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await GoalService.contribute_to_goal(
            db=db,
            user_id=current_user.id,
            goal_id=goal_id,
            amount_inr=data.amount_inr
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await GoalService.delete_goal(db=db, user_id=current_user.id, goal_id=goal_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
    return None
