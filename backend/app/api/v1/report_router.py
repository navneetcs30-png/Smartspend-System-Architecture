import io
import csv
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.services.analytics_service import AnalyticsService
from app.services.ledger_service import paise_to_inr
from app.schemas.report import DashboardSummaryResponse, DailyReportResponse

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard(
    year: Optional[int] = Query(default=None),
    month: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_dashboard_summary(
        db=db,
        user_id=current_user.id,
        year=year,
        month=month
    )

@router.get("/daily", response_model=DailyReportResponse)
async def get_daily(
    target_date: Optional[date] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    selected_date = target_date or date.today()
    return await AnalyticsService.get_daily_report(
        db=db,
        user_id=current_user.id,
        target_date=selected_date
    )

@router.get("/export")
async def export_transactions_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    txns_res = await db.execute(
        select(Transaction).where(Transaction.user_id == current_user.id).order_by(Transaction.transaction_date.desc())
    )
    txns = txns_res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Date", "Description", "Merchant", "Amount (INR)",
        "Type", "Payment Method", "Payment Source", "Reference/UTR", "Status"
    ])

    for t in txns:
        writer.writerow([
            t.id,
            t.transaction_date.strftime("%d/%m/%Y %H:%M"),
            t.description,
            t.merchant_name or "",
            f"{paise_to_inr(t.amount_paise):.2f}",
            t.transaction_type,
            t.payment_method,
            t.payment_source or "",
            t.reference_utr or "",
            t.verification_status
        ])

    csv_data = output.getvalue()
    filename = f"smartspend_transactions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
