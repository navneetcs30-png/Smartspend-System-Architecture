from pydantic import BaseModel, Field
from typing import Optional

class AccountCreate(BaseModel):
    name: str # e.g. "Paytm Wallet", "HDFC Salary Account", "Cash"
    account_type: str = "BANK" # 'BANK', 'WALLET', 'CREDIT_CARD', 'CASH'
    institution_name: Optional[str] = None
    mask_account_number: Optional[str] = None
    initial_balance_inr: float = Field(default=0.0, ge=0.0)

class AccountOut(BaseModel):
    id: str
    name: str
    account_type: str
    institution_name: Optional[str] = None
    mask_account_number: Optional[str] = None
    current_balance_paise: int
    current_balance_inr: float
    is_active: bool

    class Config:
        from_attributes = True
