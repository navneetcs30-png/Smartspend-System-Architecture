from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = "tag"
    color: Optional[str] = "#6366F1"
    category_type: str = "EXPENSE" # 'EXPENSE', 'INCOME', 'BOTH'

class CategoryOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    slug: str
    icon: str
    color: str
    category_type: str
    is_system: bool

    class Config:
        from_attributes = True
