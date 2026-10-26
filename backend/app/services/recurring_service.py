import uuid
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.recurring import RecurringExpense
from app.models.category import Category
from app.services.ledger_service import inr_to_paise, paise_to_inr
from app.schemas.recurring import RecurringCreate, RecurringUpdate, RecurringOut

class RecurringService:
    @staticmethod
    async def create_recurring(db: AsyncSession, user_id: str, data: RecurringCreate) -> RecurringOut:
        amt_paise = inr_to_paise(data.expected_amount_inr)
        rec = RecurringExpense(
            id=str(uuid.uuid4()),
            user_id=user_id,
            category_id=data.category_id,
            merchant_name=data.merchant_name.strip(),
            expected_amount_paise=amt_paise,
            frequency=data.frequency.upper(),
            next_due_date=data.next_due_date,
            importance=data.importance.upper(),
            is_active=True
        )
        db.add(rec)
        await db.commit()
        await db.refresh(rec)
        return await RecurringService._format(db, rec)

    @staticmethod
    async def get_recurring_list(db: AsyncSession, user_id: str) -> List[RecurringOut]:
        res = await db.execute(
            select(RecurringExpense).where(
                and_(RecurringExpense.user_id == user_id, RecurringExpense.is_active == True)
            ).order_by(RecurringExpense.next_due_date.asc())
        )
        items = res.scalars().all()
        return [await RecurringService._format(db, r) for r in items]

    @staticmethod
    async def delete_recurring(db: AsyncSession, user_id: str, rec_id: str) -> bool:
        res = await db.execute(
            select(RecurringExpense).where(and_(RecurringExpense.id == rec_id, RecurringExpense.user_id == user_id))
        )
        r = res.scalar_one_or_none()
        if not r:
            return False
        await db.delete(r)
        await db.commit()
        return True

    @staticmethod
    async def _format(db: AsyncSession, rec: RecurringExpense) -> RecurringOut:
        inr = paise_to_inr(rec.expected_amount_paise)
        freq_multiplier = {
            "MONTHLY": 12,
            "WEEKLY": 52,
            "QUARTERLY": 4,
            "YEARLY": 1
        }.get(rec.frequency, 12)
        yearly_cost = round(inr * freq_multiplier, 2)

        today = date.today()
        days_due = (rec.next_due_date - today).days

        cat_name = None
        if rec.category_id:
            cat = await db.get(Category, rec.category_id)
            if cat:
                cat_name = cat.name

        return RecurringOut(
            id=rec.id,
            merchant_name=rec.merchant_name,
            expected_amount_inr=inr,
            frequency=rec.frequency,
            yearly_cost_inr=yearly_cost,
            next_due_date=rec.next_due_date,
            days_until_due=days_due,
            importance=rec.importance,
            is_active=rec.is_active,
            category_id=rec.category_id,
            category_name=cat_name,
            created_at=rec.created_at
        )
