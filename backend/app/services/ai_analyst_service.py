import json
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.recurring import RecurringExpense
from app.models.insight import SpendingInsight
from app.services.ledger_service import paise_to_inr
from app.services.analytics_service import AnalyticsService
from app.schemas.ai import AIChatResponse, SpendingInsightOut

class AIAnalystService:
    @staticmethod
    async def process_chat_query(
        db: AsyncSession,
        user_id: str,
        message: str
    ) -> AIChatResponse:
        msg_lower = message.lower().strip()
        now = datetime.now()

        # Tool 1: "Where did my money go / categories / breakdown"
        if any(k in msg_lower for k in ["where did my money go", "breakdown", "category", "categories", "spending distribution"]):
            summary = await AnalyticsService.get_dashboard_summary(db, user_id)
            if not summary.category_breakdown:
                return AIChatResponse(
                    response="You have not recorded any expenses for this month yet. Once you log or import transactions, I will provide a detailed breakdown of where your money went.",
                    suggested_actions=["Add a transaction", "Import Paytm/PhonePe statement"]
                )
            
            top_3 = summary.category_breakdown[:3]
            top_str = ", ".join([f"**{c.category_name}** at ₹{c.total_inr:,.2f} ({c.percentage}%)" for c in top_3])
            
            resp = (
                f"This month ({summary.period_label}), you have spent a total of **₹{summary.total_expenses_inr:,.2f}**.\n\n"
                f"Your top spending categories are:\n"
                f"1. {top_str}\n\n"
                f"Your net savings this month stand at **₹{summary.net_savings_inr:,.2f}** (Savings Rate: **{summary.savings_rate}%**)."
            )
            return AIChatResponse(
                response=resp,
                suggested_actions=["Review food budget", "Check daily trends", "View subscriptions"],
                structured_metrics={"total_expense": summary.total_expenses_inr, "top_categories": [c.model_dump() for c in top_3]}
            )

        # Tool 2: Category specific inquiry (Food, Shopping, Travel, etc.)
        cats_res = await db.execute(select(Category))
        all_cats = cats_res.scalars().all()
        matched_cat = next((c for c in all_cats if c.name.lower() in msg_lower or c.slug.replace("-", " ") in msg_lower), None)

        if matched_cat:
            # Query category spend for this month
            start_month = datetime(now.year, now.month, 1)
            txns_res = await db.execute(
                select(Transaction).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.category_id == matched_cat.id,
                        Transaction.transaction_date >= start_month,
                        Transaction.transaction_type == "EXPENSE"
                    )
                )
            )
            cat_txns = txns_res.scalars().all()
            total_cat_paise = sum(t.amount_paise for t in cat_txns)
            total_cat_inr = paise_to_inr(total_cat_paise)

            resp = (
                f"You have recorded **₹{total_cat_inr:,.2f}** spent on **{matched_cat.name}** across {len(cat_txns)} transactions this month.\n\n"
            )
            if cat_txns:
                largest = max(cat_txns, key=lambda x: x.amount_paise)
                resp += f"The largest expense in this category was **₹{paise_to_inr(largest.amount_paise):,.2f}** for *{largest.description}* on {largest.transaction_date.strftime('%d %b')}."

            return AIChatResponse(
                response=resp,
                suggested_actions=[f"Set budget for {matched_cat.name}", "View all transactions"],
                structured_metrics={"category": matched_cat.name, "spent_inr": total_cat_inr}
            )

        # Tool 3: "Largest / Top expenses"
        if any(k in msg_lower for k in ["largest", "biggest", "top expenses", "top 5", "highest"]):
            txns_res = await db.execute(
                select(Transaction).where(
                    and_(
                        Transaction.user_id == user_id,
                        Transaction.transaction_type == "EXPENSE"
                    )
                ).order_by(Transaction.amount_paise.desc()).limit(5)
            )
            top_txns = txns_res.scalars().all()
            if not top_txns:
                return AIChatResponse(
                    response="No expenses found in your ledger yet.",
                    suggested_actions=["Record an expense"]
                )

            lines = []
            for idx, t in enumerate(top_txns, 1):
                merchant = f" ({t.merchant_name})" if t.merchant_name else ""
                lines.append(f"{idx}. **₹{paise_to_inr(t.amount_paise):,.2f}** — {t.description}{merchant} on {t.transaction_date.strftime('%d %b %Y')}")

            resp = "Here are your top 5 largest recorded expenses:\n\n" + "\n".join(lines)
            return AIChatResponse(
                response=resp,
                suggested_actions=["Check monthly budget", "Inspect category trends"]
            )

        # Tool 4: "Budget status / Staying within budget"
        if any(k in msg_lower for k in ["budget", "staying within", "limit", "overspending"]):
            budgets_res = await db.execute(
                select(Budget).where(and_(Budget.user_id == user_id, Budget.is_active == True))
            )
            budgets = budgets_res.scalars().all()
            if not budgets:
                return AIChatResponse(
                    response="You have not configured any spending budgets yet. Setting a monthly or category budget helps you track whether you are on pace to save.",
                    suggested_actions=["Create Monthly Budget", "Set Food Budget"]
                )
            summary = await AnalyticsService.get_dashboard_summary(db, user_id)
            if summary.total_monthly_budget_inr:
                rem = summary.remaining_monthly_budget_inr or 0
                pct = summary.budget_usage_percent or 0
                status_text = "within your target limit! 🎯" if pct < 90 else "approaching your maximum threshold. ⚠️"
                resp = (
                    f"For this month, your overall budget is **₹{summary.total_monthly_budget_inr:,.2f}**.\n"
                    f"You have spent **₹{summary.total_expenses_inr:,.2f}** ({pct}% used), leaving **₹{rem:,.2f}** remaining.\n\n"
                    f"You are currently {status_text}"
                )
                return AIChatResponse(response=resp, suggested_actions=["Review budgets page", "See daily burn rate"])

        # Tool 5: "Subscriptions / Recurring"
        if any(k in msg_lower for k in ["subscription", "subscriptions", "recurring", "netflix", "gym", "recharge"]):
            rec_res = await db.execute(
                select(RecurringExpense).where(and_(RecurringExpense.user_id == user_id, RecurringExpense.is_active == True))
            )
            recs = rec_res.scalars().all()
            if not recs:
                return AIChatResponse(
                    response="You do not have any active recurring subscriptions registered. You can add your OTT, mobile recharges, or gym memberships to monitor their yearly cost impact.",
                    suggested_actions=["Add subscription", "Scan transactions"]
                )
            total_monthly_paise = sum(r.expected_amount_paise for r in recs if r.frequency == "MONTHLY")
            total_monthly_inr = paise_to_inr(total_monthly_paise)
            annual_impact_inr = total_monthly_inr * 12
            names = ", ".join([r.merchant_name for r in recs[:4]])

            resp = (
                f"You have **{len(recs)} active recurring services** tracked ({names}).\n\n"
                f"• Monthly commitment: **₹{total_monthly_inr:,.2f}**\n"
                f"• Annualized total impact: **₹{annual_impact_inr:,.2f}/year**\n\n"
                f"Tip: Review any services you haven't used this month to free up savings."
            )
            return AIChatResponse(response=resp, suggested_actions=["View all subscriptions", "Review optional spends"])

        # Tool 6: "How to save / reduce spending / advice"
        if any(k in msg_lower for k in ["save", "reduce", "cut down", "tips", "advice", "improve"]):
            summary = await AnalyticsService.get_dashboard_summary(db, user_id)
            resp = (
                f"Based on your recorded transactions for {summary.period_label}:\n\n"
                f"1. **Discretionary Food & Delivery:** Discretionary convenience spending (food apps, quick tea/snacks) is often the easiest lever to optimize. Reducing discretionary orders by just ₹500/week saves **₹26,000 annually**.\n"
                f"2. **Savings Rule of Thumb:** Aim to allocate at least 20% of income directly toward your Savings Goals at the start of each month (pay yourself first).\n"
                f"3. **Set Alert Limits:** Define a 75% warning limit on high-frequency categories like Shopping and Dining so you get alerted before exceeding your budget."
            )
            return AIChatResponse(
                response=resp,
                suggested_actions=["Create savings goal", "Set shopping budget", "Export report"]
            )

        # Default conversational fallback with actual data context
        summary = await AnalyticsService.get_dashboard_summary(db, user_id)
        resp = (
            f"I am your **SmartSpend AI Financial Analyst**. Here is your current snapshot for {summary.period_label}:\n\n"
            f"• **Total Income:** ₹{summary.total_income_inr:,.2f}\n"
            f"• **Total Expenses:** ₹{summary.total_expenses_inr:,.2f}\n"
            f"• **Net Savings:** ₹{summary.net_savings_inr:,.2f} (Savings Rate: {summary.savings_rate}%)\n\n"
            f"You can ask me questions like:\n"
            f"• *'Where did my money go this month?'*\n"
            f"• *'How much did I spend on Food?'*\n"
            f"• *'What are my largest expenses?'*\n"
            f"• *'Which recurring payments should I review?'*\n"
            f"• *'How can I save ₹5,000 next month?'*"
        )
        return AIChatResponse(
            response=resp,
            suggested_actions=["Where did my money go?", "What are my largest expenses?", "Am I staying within budget?"]
        )

    @staticmethod
    async def get_active_insights(db: AsyncSession, user_id: str) -> List[SpendingInsightOut]:
        # Generate dynamic proactive insights based on real ledger data
        summary = await AnalyticsService.get_dashboard_summary(db, user_id)
        insights: List[SpendingInsightOut] = []

        # 1. High discretionary spending insight
        for cat in summary.category_breakdown:
            if cat.category_name in ["Food & Dining", "Shopping", "Entertainment"] and cat.percentage > 30:
                potential = round(cat.total_inr * 0.20, 2)
                insights.append(
                    SpendingInsightOut(
                        id="dyn-spike-" + cat.category_name.lower().replace(" ", "-"),
                        insight_type="BUDGET_SPIKE",
                        title=f"High {cat.category_name} Spending",
                        description=f"{cat.category_name} represents {cat.percentage}% of your total expenses this month (₹{cat.total_inr:,.2f}). Trimming discretionary items by 20% would save ₹{potential:,.2f} per month (₹{potential * 12:,.2f} per year).",
                        potential_savings_inr=potential,
                        evidence_data={"category": cat.category_name, "spent": cat.total_inr, "percentage": cat.percentage},
                        is_dismissed=False,
                        is_applied=False,
                        created_at=datetime.now(timezone.utc)
                    )
                )

        # 2. Savings rate check
        if summary.total_income_inr > 0 and summary.savings_rate < 20:
            target_savings = round(summary.total_income_inr * 0.20 - summary.net_savings_inr, 2)
            insights.append(
                SpendingInsightOut(
                    id="dyn-savings-rate",
                    insight_type="SAVINGS_OPPORTUNITY",
                    title="Boost Your Savings Rate to 20%",
                    description=f"Your current savings rate is {summary.savings_rate}%. Financial planners recommend saving at least 20% of net income. Saving an extra ₹{target_savings:,.2f} this month will put you on track.",
                    potential_savings_inr=target_savings,
                    evidence_data={"current_rate": summary.savings_rate, "target_rate": 20},
                    is_dismissed=False,
                    is_applied=False,
                    created_at=datetime.now(timezone.utc)
                )
            )

        return insights
