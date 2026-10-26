from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=2, max_length=120)
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPreferencesOut(BaseModel):
    currency: str = "INR"
    date_format: str = "DD/MM/YYYY"
    timezone: str = "Asia/Kolkata"
    theme: str = "system"
    ai_insights_enabled: bool = True
    email_notifications: bool = True

    class Config:
        from_attributes = True

class UserPreferencesUpdate(BaseModel):
    currency: Optional[str] = None
    date_format: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    ai_insights_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    preferences: Optional[UserPreferencesOut] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
