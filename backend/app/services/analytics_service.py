import calendar
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.services.ledger_service import paise_to_inr
from app.schemas.report import (
    DashboardSummaryResponse,
    CategorySpendItem,
    DailySpendTrendItem,
    PaymentMethodBreakdown,
    DailyReportResponse,
    MonthlyReportResponse,
    YearlyReportResponse
)

class AnalyticsService:
    @staticmethod
    async def get_dashboard_summary(
        db: AsyncSession,
        user_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> DashboardSummaryResponse:
        now = datetime.now()
        target_year = year or now.year
        target_month = month or now.month
        
        # Month date bounds
        num_days = calendar.monthrange(target_year, target_month)[1]
        start_date = datetime(target_year, target_month, 1, 0, 0, 0)
        end_date = datetime(target_year, target_month, num_days, 23, 59, 59)

        # 1. Base Query for the selected month
        txns_query = select(Transaction).where(
            and_(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date
            )
        )
        res = await db.execute(txns_query)
        txns = res.scalars().all()

        total_income_paise = 0
        total_expense_paise = 0
        total_refund_paise = 0
        largest_expense_paise = 0
        largest_merchant = None
        method_counts: Dict[str, Dict[str, Any]] = {}
        daily_buckets: Dict[str, Dict[str, int]] = {
            f"{target_year}-{target_month:02d}-{d:02d}": {"income": 0, "expense": 0}
            for d in range(1, num_days + 1)
        }
        category_buckets: Dict[Optional[str], int] = {}

        for t in txns:
            date_key = t.transaction_date.strftime("%Y-%m-%d")
            
            if t.transaction_type == "INCOME":
                total_income_paise += t.amount_paise
                if date_key in daily_buckets:
                    daily_buckets[date_key]["income"] += t.amount_paise
            elif t.transaction_type == "EXPENSE":
                total_expense_paise += t.amount_paise
                if t.amount_paise > largest_expense_paise:
                    largest_expense_paise = t.amount_paise
                    largest_merchant = t.merchant_name or t.description
                if date_key in daily_buckets:
                    daily_buckets[date_key]["expense"] += t.amount_paise
                
                cat_id = t.category_id
                category_buckets[cat_id] = category_buckets.get(cat_id, 0) + t.amount_paise
                
                # Payment method
                pm = t.payment_method or "UPI"
                if pm not in method_counts:
                    method_counts[pm] = {"paise": 0, "count": 0}
                method_counts[pm]["paise"] += t.amount_paise
                method_counts[pm]["count"] += 1

            elif t.transaction_type == "REFUND":
                total_refund_paise += t.amount_paise
                # Refunds directly reduce effective expense in daily trends & category
                cat_id = t.category_id
                if cat_id in category_buckets:
                    category_buckets[cat_id] = max(0, category_buckets[cat_id] - t.amount_paise)

        # Net calculations
        effective_expenses_paise = max(0, total_expense_paise - total_refund_paise)
        net_savings_paise = total_income_paise - effective_expenses_paise
        
        # Savings Rate: (Net Savings / Total Income) * 100
        savings_rate = 0.0
        if total_income_paise > 0:
            savings_rate = round((net_savings_paise / total_income_paise) * 100.0, 1)

        # Days elapsed in month for daily average
        days_elapsed = now.day if (target_year == now.year and target_month == now.month) else num_days
        avg_daily_paise = effective_expenses_paise // max(1, days_elapsed)

        # 2. Category Breakdown metadata resolution
        cat_items: List[CategorySpendItem] = []
        if category_buckets:
            cats_res = await db.execute(select(Category))
            all_cats = {c.id: c for c in cats_res.scalars().all()}
            for cat_id, amt_paise in category_buckets.items():
                cat = all_cats.get(cat_id)
                pct = round((amt_paise / max(1, effective_expenses_paise)) * 100.0, 1) if effective_expenses_paise > 0 else 0.0
                cat_items.append(
                    CategorySpendItem(
                        category_id=cat_id,
                        category_name=cat.name if cat else "Uncategorized",
                        color=cat.color if cat else "#94A3B8",
                        icon=cat.icon if cat else "tag",
                        total_paise=amt_paise,
                        total_inr=paise_to_inr(amt_paise),
                        percentage=pct,
                        count=1
                    )
                )
            cat_items.sort(key=lambda x: x.total_paise, reverse=True)

        # 3. Daily trends list
        trend_items: List[DailySpendTrendItem] = []
        for date_str in sorted(daily_buckets.keys()):
            inc_p = daily_buckets[date_str]["income"]
            exp_p = daily_buckets[date_str]["expense"]
            d_obj = datetime.strptime(date_str, "%Y-%m-%d")
            trend_items.append(
                DailySpendTrendItem(
                    date=date_str,
                    day_label=d_obj.strftime("%d %b"),
                    income_inr=paise_to_inr(inc_p),
                    expense_inr=paise_to_inr(exp_p),
                    net_inr=paise_to_inr(inc_p - exp_p)
                )
            )

        # 4. Payment method list
        pm_items: List[PaymentMethodBreakdown] = []
        for pm, data in method_counts.items():
            pct = round((data["paise"] / max(1, total_expense_paise)) * 100.0, 1) if total_expense_paise > 0 else 0.0
            pm_items.append(
                PaymentMethodBreakdown(
                    method=pm,
                    total_inr=paise_to_inr(data["paise"]),
                    count=data["count"],
                    percentage=pct
                )
            )
        pm_items.sort(key=lambda x: x.total_inr, reverse=True)

        # 5. Overall Monthly Budget checking
        budget_res = await db.execute(
            select(Budget).where(
                and_(
                    Budget.user_id == user_id,
                    Budget.category_id == None,
                    Budget.period == "MONTHLY",
                    Budget.is_active == True
                )
            )
        )
        overall_budget = budget_res.scalar_one_or_none()
        total_budget_inr = None
        remaining_budget_inr = None
        budget_usage_pct = None

        if overall_budget:
            total_budget_inr = paise_to_inr(overall_budget.limit_amount_paise)
            spent_inr = paise_to_inr(effective_expenses_paise)
            remaining_budget_inr = round(max(0.0, total_budget_inr - spent_inr), 2)
            budget_usage_pct = round((spent_inr / max(1.0, total_budget_inr)) * 100.0, 1)

        month_label = f"{calendar.month_name[target_month]} {target_year}"

        return DashboardSummaryResponse(
            period_label=month_label,
            total_income_inr=paise_to_inr(total_income_paise),
            total_expenses_inr=paise_to_inr(effective_expenses_paise),
            net_savings_inr=paise_to_inr(net_savings_paise),
            savings_rate=savings_rate,
            remaining_monthly_budget_inr=remaining_budget_inr,
            total_monthly_budget_inr=total_budget_inr,
            budget_usage_percent=budget_usage_pct,
            transaction_count=len(txns),
            largest_expense_inr=paise_to_inr(largest_expense_paise),
            largest_expense_merchant=largest_merchant,
            avg_daily_spending_inr=paise_to_inr(avg_daily_paise),
            daily_trends=trend_items,
            category_breakdown=cat_items,
            payment_method_breakdown=pm_items
        )

    @staticmethod
    async def get_daily_report(
        db: AsyncSession,
        user_id: str,
        target_date: date
    ) -> DailyReportResponse:
        start_dt = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_dt = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59)

        res = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.transaction_date >= start_dt,
                    Transaction.transaction_date <= end_dt
                )
            ).order_by(Transaction.transaction_date.desc())
        )
        txns = res.scalars().all()

        income_paise = 0
        expense_paise = 0
        largest_paise = 0
        category_map: Dict[Optional[str], int] = {}

        for t in txns:
            if t.transaction_type == "INCOME":
                income_paise += t.amount_paise
            elif t.transaction_type == "EXPENSE":
                expense_paise += t.amount_paise
                if t.amount_paise > largest_paise:
                    largest_paise = t.amount_paise
                cat = t.category_id
                category_map[cat] = category_map.get(cat, 0) + t.amount_paise
            elif t.transaction_type == "REFUND":
                expense_paise = max(0, expense_paise - t.amount_paise)

        cats_res = await db.execute(select(Category))
        all_cats = {c.id: c for c in cats_res.scalars().all()}
        cat_items: List[CategorySpendItem] = []
        for c_id, amt_p in category_map.items():
            c = all_cats.get(c_id)
            cat_items.append(
                CategorySpendItem(
                    category_id=c_id,
                    category_name=c.name if c else "Uncategorized",
                    color=c.color if c else "#94A3B8",
                    icon=c.icon if c else "tag",
                    total_paise=amt_p,
                    total_inr=paise_to_inr(amt_p),
                    percentage=round((amt_p / max(1, expense_paise)) * 100.0, 1),
                    count=1
                )
            )

        return DailyReportResponse(
            date=target_date.strftime("%Y-%m-%d"),
            total_income_inr=paise_to_inr(income_paise),
            total_expenses_inr=paise_to_inr(expense_paise),
            net_cashflow_inr=paise_to_inr(income_paise - expense_paise),
            transaction_count=len(txns),
            largest_transaction_inr=paise_to_inr(largest_paise),
            remaining_daily_budget_inr=None,
            categories=cat_items,
            transactions=[]
        )
