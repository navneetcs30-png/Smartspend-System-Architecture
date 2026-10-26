import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User, UserPreferences
from app.models.account import Account
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserOut, UserPreferencesUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if email already registered
    existing = await db.execute(select(User).where(User.email == data.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = get_password_hash(data.password)

    user = User(
        id=user_id,
        email=data.email.lower(),
        password_hash=hashed_pwd,
        full_name=data.full_name.strip(),
        phone=data.phone.strip() if data.phone else None,
        is_active=True,
        is_verified=True
    )
    db.add(user)

    # Create default preferences
    prefs = UserPreferences(
        id=str(uuid.uuid4()),
        user_id=user_id,
        currency="INR",
        date_format="DD/MM/YYYY",
        timezone="Asia/Kolkata",
        theme="system"
    )
    db.add(prefs)

    # Create default default accounts (Paytm/UPI, Bank Account, Cash)
    default_accs = [
        Account(id=str(uuid.uuid4()), user_id=user_id, name="UPI / PhonePe / Paytm", account_type="WALLET", current_balance_paise=0),
        Account(id=str(uuid.uuid4()), user_id=user_id, name="Primary Bank Account", account_type="BANK", current_balance_paise=0),
        Account(id=str(uuid.uuid4()), user_id=user_id, name="Cash in Hand", account_type="CASH", current_balance_paise=0),
    ]
    for acc in default_accs:
        db.add(acc)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(User).where(User.email == data.email.lower()))
    user = res.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.patch("/preferences")
async def update_preferences(
    data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(UserPreferences).where(UserPreferences.user_id == current_user.id))
    prefs = res.scalar_one_or_none()
    if not prefs:
        prefs = UserPreferences(id=str(uuid.uuid4()), user_id=current_user.id)
        db.add(prefs)

    if data.currency is not None:
        prefs.currency = data.currency
    if data.date_format is not None:
        prefs.date_format = data.date_format
    if data.timezone is not None:
        prefs.timezone = data.timezone
    if data.theme is not None:
        prefs.theme = data.theme
    if data.ai_insights_enabled is not None:
        prefs.ai_insights_enabled = data.ai_insights_enabled
    if data.email_notifications is not None:
        prefs.email_notifications = data.email_notifications

    prefs.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Preferences updated successfully."}
