import calendar
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.insight import Notification
from app.services.ledger_service import inr_to_paise, paise_to_inr
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetProgressOut, BudgetOverviewResponse

class BudgetService:
    @staticmethod
    async def create_budget(
        db: AsyncSession,
        user_id: str,
        data: BudgetCreate
    ) -> Budget:
        limit_paise = inr_to_paise(data.limit_amount_inr)
        
        # Check if already exists for this category and period
        existing = await db.execute(
            select(Budget).where(
                and_(
                    Budget.user_id == user_id,
                    Budget.category_id == data.category_id,
                    Budget.period == data.period.upper()
                )
            )
        )
        b = existing.scalar_one_or_none()
        if b:
            # Update existing
            b.limit_amount_paise = limit_paise
            b.is_active = True
            await db.commit()
            await db.refresh(b)
            return b

        new_budget = Budget(
            id=str(uuid.uuid4()),
            user_id=user_id,
            category_id=data.category_id,
            period=data.period.upper(),
            limit_amount_paise=limit_paise,
            alert_at_50=data.alert_at_50,
            alert_at_75=data.alert_at_75,
            alert_at_90=data.alert_at_90,
            alert_at_100=data.alert_at_100,
            is_active=True
        )
        db.add(new_budget)
        await db.commit()
        await db.refresh(new_budget)
        return new_budget

    @staticmethod
    async def get_budgets_progress(
        db: AsyncSession,
        user_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> BudgetOverviewResponse:
        now = datetime.now()
        target_year = year or now.year
        target_month = month or now.month
        num_days = calendar.monthrange(target_year, target_month)[1]
        start_date = datetime(target_year, target_month, 1, 0, 0, 0)
        end_date = datetime(target_year, target_month, num_days, 23, 59, 59)
        
        days_passed = now.day if (target_year == now.year and target_month == now.month) else num_days
        days_remaining = max(0, num_days - days_passed)

        # Get all active budgets
        budgets_res = await db.execute(
            select(Budget).where(and_(Budget.user_id == user_id, Budget.is_active == True))
        )
        budgets = budgets_res.scalars().all()

        cats_res = await db.execute(select(Category))
        cat_map = {c.id: c for c in cats_res.scalars().all()}

        # Get all expense transactions in month
        txns_res = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.transaction_date >= start_date,
                    Transaction.transaction_date <= end_date,
                    Transaction.transaction_type.in_(["EXPENSE", "REFUND"])
                )
            )
        )
        txns = txns_res.scalars().all()

        # Compute spending by category
        spent_by_category: dict[Optional[str], int] = {}
        total_monthly_expense_paise = 0

        for t in txns:
            if t.transaction_type == "EXPENSE":
                total_monthly_expense_paise += t.amount_paise
                spent_by_category[t.category_id] = spent_by_category.get(t.category_id, 0) + t.amount_paise
            elif t.transaction_type == "REFUND":
                total_monthly_expense_paise = max(0, total_monthly_expense_paise - t.amount_paise)
                if t.category_id in spent_by_category:
                    spent_by_category[t.category_id] = max(0, spent_by_category[t.category_id] - t.amount_paise)

        progress_items: List[BudgetProgressOut] = []
        total_budgeted_paise = 0
        total_budget_spent_paise = 0

        for b in budgets:
            limit_inr = paise_to_inr(b.limit_amount_paise)
            total_budgeted_paise += b.limit_amount_paise

            if b.category_id is None:
                # Overall monthly budget
                spent_paise = total_monthly_expense_paise
                cat_name = "Overall Monthly Budget"
                cat_icon = "pie-chart"
                cat_color = "#10B981"
            else:
                spent_paise = spent_by_category.get(b.category_id, 0)
                cat = cat_map.get(b.category_id)
                cat_name = cat.name if cat else "Category"
                cat_icon = cat.icon if cat else "tag"
                cat_color = cat.color if cat else "#6366F1"

            total_budget_spent_paise += spent_paise
            spent_inr = paise_to_inr(spent_paise)
            remaining_inr = round(max(0.0, limit_inr - spent_inr), 2)
            pct_used = round((spent_inr / max(1.0, limit_inr)) * 100.0, 1)

            # EOM projected spend
            daily_burn_inr = spent_inr / max(1, days_passed)
            projected_eom = round(spent_inr + (daily_burn_inr * days_remaining), 2)

            # Alert level
            if pct_used >= 100.0:
                alert_lvl = "EXCEEDED"
            elif pct_used >= 90.0:
                alert_lvl = "CRITICAL_90"
            elif pct_used >= 75.0:
                alert_lvl = "WARNING_75"
            else:
                alert_lvl = "NORMAL"

            progress_items.append(
                BudgetProgressOut(
                    id=b.id,
                    category_id=b.category_id,
                    category_name=cat_name,
                    category_icon=cat_icon,
                    category_color=cat_color,
                    period=b.period,
                    limit_amount_inr=limit_inr,
                    spent_amount_inr=spent_inr,
                    remaining_amount_inr=remaining_inr,
                    percentage_used=pct_used,
                    days_remaining=days_remaining,
                    projected_eom_spend_inr=projected_eom,
                    alert_level=alert_lvl,
                    is_active=b.is_active
                )
            )

        total_budgeted_inr = paise_to_inr(total_budgeted_paise)
        total_spent_inr = paise_to_inr(total_budget_spent_paise)
        overall_rem = round(max(0.0, total_budgeted_inr - total_spent_inr), 2)
        overall_pct = round((total_spent_inr / max(1.0, total_budgeted_inr)) * 100.0, 1) if total_budgeted_inr > 0 else 0.0

        return BudgetOverviewResponse(
            total_budgeted_inr=total_budgeted_inr,
            total_spent_inr=total_spent_inr,
            overall_remaining_inr=overall_rem,
            overall_percentage=overall_pct,
            budgets=progress_items
        )

    @staticmethod
    async def delete_budget(db: AsyncSession, user_id: str, budget_id: str) -> bool:
        res = await db.execute(
            select(Budget).where(and_(Budget.id == budget_id, Budget.user_id == user_id))
        )
        b = res.scalar_one_or_none()
        if not b:
            return False
        await db.delete(b)
        await db.commit()
        return True
