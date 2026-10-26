from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.import_job import ImportJob
from app.services.import_service import ImportService
from app.schemas.import_job import ImportPreviewResponse, ImportConfirmRequest, ImportJobOut

from fastapi.responses import Response

router = APIRouter(prefix="/imports", tags=["Statement Import & Reconciliation"])

@router.get("/template")
async def get_sample_template():
    sample_csv = (
        "Date,Description,Amount,Type,Reference ID\n"
        "25/10/2026,Swiggy Order #94821,380.00,Debit,UPI202610259812\n"
        "24/10/2026,Salary Credit Infosys Ltd,85000.00,Credit,NEFT202610240192\n"
        "23/10/2026,Shell Petrol Pump Bangalore,1500.00,Debit,POS202610237712\n"
        "22/10/2026,Apollo Pharmacy Health,650.00,Debit,UPI202610224410\n"
        "21/10/2026,Amazon India Shopping,2199.00,Debit,UPI202610219981\n"
        "20/10/2026,Cult.fit Monthly Membership,1800.00,Debit,UPI202610203341\n"
    )
    return Response(
        content=sample_csv,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=smartspend_sample_statement.csv"}
    )

@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_statement_upload(
    file: UploadFile = File(...),
    source_type: str = Form(default="PAYTM"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not (file.filename.endswith(".csv") or file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a valid CSV or Excel (.xlsx/.xls) statement file."
        )

    content = await file.read()
    try:
        preview = await ImportService.preview_statement(
            db=db,
            user_id=current_user.id,
            file_bytes=content,
            file_name=file.filename,
            source_type=source_type
        )
        return preview
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

@router.post("/confirm", response_model=ImportJobOut)
async def confirm_statement_import(
    data: ImportConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    job = await ImportService.confirm_import(
        db=db,
        user_id=current_user.id,
        data=data
    )
    return ImportJobOut.model_validate(job)

@router.get("/history", response_model=List[ImportJobOut])
async def list_import_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ImportJob).where(ImportJob.user_id == current_user.id).order_by(ImportJob.created_at.desc())
    )
    jobs = res.scalars().all()
    return [ImportJobOut.model_validate(j) for j in jobs]
