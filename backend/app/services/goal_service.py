import uuid
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.goal import SavingsGoal
from app.services.ledger_service import inr_to_paise, paise_to_inr
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut

class GoalService:
    @staticmethod
    async def create_goal(db: AsyncSession, user_id: str, data: GoalCreate) -> GoalOut:
        target_paise = inr_to_paise(data.target_amount_inr)
        current_paise = inr_to_paise(data.current_amount_inr)

        goal = SavingsGoal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=data.title.strip(),
            target_amount_paise=target_paise,
            current_amount_paise=current_paise,
            target_date=data.target_date,
            status="IN_PROGRESS",
            notes=data.notes
        )
        db.add(goal)
        await db.commit()
        await db.refresh(goal)
        return GoalService._format_goal(goal)

    @staticmethod
    async def get_goals(db: AsyncSession, user_id: str) -> List[GoalOut]:
        res = await db.execute(
            select(SavingsGoal).where(SavingsGoal.user_id == user_id).order_by(SavingsGoal.target_date.asc())
        )
        goals = res.scalars().all()
        return [GoalService._format_goal(g) for g in goals]

    @staticmethod
    async def contribute_to_goal(db: AsyncSession, user_id: str, goal_id: str, amount_inr: float) -> GoalOut:
        res = await db.execute(
            select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id))
        )
        goal = res.scalar_one_or_none()
        if not goal:
            raise ValueError("Savings goal not found.")

        add_paise = inr_to_paise(amount_inr)
        goal.current_amount_paise += add_paise
        if goal.current_amount_paise >= goal.target_amount_paise:
            goal.status = "COMPLETED"

        goal.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(goal)
        return GoalService._format_goal(goal)

    @staticmethod
    async def delete_goal(db: AsyncSession, user_id: str, goal_id: str) -> bool:
        res = await db.execute(
            select(SavingsGoal).where(and_(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id))
        )
        g = res.scalar_one_or_none()
        if not g:
            return False
        await db.delete(g)
        await db.commit()
        return True

    @staticmethod
    def _format_goal(goal: SavingsGoal) -> GoalOut:
        target_inr = paise_to_inr(goal.target_amount_paise)
        current_inr = paise_to_inr(goal.current_amount_paise)
        remaining_inr = max(0.0, round(target_inr - current_inr, 2))
        pct = round((current_inr / max(1.0, target_inr)) * 100.0, 1)

        today = date.today()
        days_left = max(0, (goal.target_date - today).days)
        months_left = max(1.0, days_left / 30.416)
        monthly_needed = round(remaining_inr / months_left, 2) if remaining_inr > 0 else 0.0

        return GoalOut(
            id=goal.id,
            title=goal.title,
            target_amount_inr=target_inr,
            current_amount_inr=current_inr,
            remaining_amount_inr=remaining_inr,
            progress_percentage=min(100.0, pct),
            target_date=goal.target_date,
            days_left=days_left,
            monthly_savings_needed_inr=monthly_needed,
            status=goal.status,
            notes=goal.notes,
            created_at=goal.created_at
        )
