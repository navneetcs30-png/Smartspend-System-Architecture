import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.account import Account
from app.services.ledger_service import inr_to_paise, paise_to_inr
from app.schemas.account import AccountCreate, AccountOut

router = APIRouter(prefix="/accounts", tags=["Accounts & Wallets"])

@router.post("", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
async def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    acc = Account(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=data.name.strip(),
        account_type=data.account_type.upper(),
        institution_name=data.institution_name.strip() if data.institution_name else None,
        mask_account_number=data.mask_account_number.strip() if data.mask_account_number else None,
        current_balance_paise=inr_to_paise(data.initial_balance_inr),
        is_active=True
    )
    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return AccountOut(
        id=acc.id,
        name=acc.name,
        account_type=acc.account_type,
        institution_name=acc.institution_name,
        mask_account_number=acc.mask_account_number,
        current_balance_paise=acc.current_balance_paise,
        current_balance_inr=paise_to_inr(acc.current_balance_paise),
        is_active=acc.is_active
    )

@router.get("", response_model=List[AccountOut])
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Account).where(Account.user_id == current_user.id, Account.is_active == True)
    )
    accs = res.scalars().all()
    return [
        AccountOut(
            id=a.id,
            name=a.name,
            account_type=a.account_type,
            institution_name=a.institution_name,
            mask_account_number=a.mask_account_number,
            current_balance_paise=a.current_balance_paise,
            current_balance_inr=paise_to_inr(a.current_balance_paise),
            is_active=a.is_active
        )
        for a in accs
    ]
