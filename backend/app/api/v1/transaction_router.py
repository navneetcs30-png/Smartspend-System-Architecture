from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.services.ledger_service import LedgerService, paise_to_inr
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    TransactionListResponse
)
from app.schemas.category import CategoryOut, CategoryCreate

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Category).where(
        or_(Category.is_system == True, Category.user_id == current_user.id)
    ).order_by(Category.category_type.asc(), Category.name.asc())
    res = await db.execute(query)
    cats = res.scalars().all()
    return [CategoryOut.model_validate(c) for c in cats]

@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        txn = await LedgerService.create_transaction(
            db=db,
            user_id=current_user.id,
            data=data
        )
        return _format_txn_out(txn)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    txn_type: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    items, total, total_income, total_expense, net_savings = await LedgerService.get_transactions(
        db=db,
        user_id=current_user.id,
        page=page,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        txn_type=txn_type,
        category_id=category_id,
        search=search
    )
    pages = max(1, (total + limit - 1) // limit)

    return TransactionListResponse(
        items=[_format_txn_out(t) for t in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        total_income_inr=total_income,
        total_expense_inr=total_expense,
        net_savings_inr=net_savings
    )

@router.get("/{txn_id}", response_model=TransactionOut)
async def get_transaction(
    txn_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Transaction).where(Transaction.id == txn_id, Transaction.user_id == current_user.id)
    )
    txn = res.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return _format_txn_out(txn)

@router.put("/{txn_id}", response_model=TransactionOut)
async def update_transaction(
    txn_id: str,
    data: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        updated = await LedgerService.update_transaction(
            db=db,
            user_id=current_user.id,
            txn_id=txn_id,
            data=data
        )
        return _format_txn_out(updated)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{txn_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    txn_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    success = await LedgerService.delete_transaction(
        db=db,
        user_id=current_user.id,
        txn_id=txn_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found.")
    return None

def _format_txn_out(txn: Transaction) -> TransactionOut:
    cat_out = None
    if txn.category:
        cat_out = CategoryOut.model_validate(txn.category)
    return TransactionOut(
        id=txn.id,
        user_id=txn.user_id,
        amount_paise=txn.amount_paise,
        amount_inr=paise_to_inr(txn.amount_paise),
        transaction_type=txn.transaction_type,
        transaction_date=txn.transaction_date,
        description=txn.description,
        merchant_name=txn.merchant_name,
        category_id=txn.category_id,
        category=cat_out,
        account_id=txn.account_id,
        destination_account_id=txn.destination_account_id,
        payment_method=txn.payment_method,
        payment_source=txn.payment_source,
        reference_utr=txn.reference_utr,
        deduplication_hash=txn.deduplication_hash,
        verification_status=txn.verification_status,
        notes=txn.notes,
        tags=txn.tags,
        created_at=txn.created_at,
        updated_at=txn.updated_at
    )
