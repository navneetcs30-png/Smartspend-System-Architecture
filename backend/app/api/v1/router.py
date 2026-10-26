from fastapi import APIRouter
from app.api.v1.auth_router import router as auth_router
from app.api.v1.transaction_router import router as transaction_router
from app.api.v1.report_router import router as report_router
from app.api.v1.budget_router import router as budget_router
from app.api.v1.goal_router import router as goal_router
from app.api.v1.recurring_router import router as recurring_router
from app.api.v1.import_router import router as import_router
from app.api.v1.ai_router import router as ai_router
from app.api.v1.account_router import router as account_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(transaction_router)
api_router.include_router(report_router)
api_router.include_router(budget_router)
api_router.include_router(goal_router)
api_router.include_router(recurring_router)
api_router.include_router(import_router)
api_router.include_router(ai_router)
api_router.include_router(account_router)
