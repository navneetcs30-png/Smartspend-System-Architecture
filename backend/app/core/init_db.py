import uuid
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal, Base
from app.models import Category

DEFAULT_SYSTEM_CATEGORIES = [
    # Expense categories tailored for Indian ecosystem
    {"name": "Food & Dining", "slug": "food-dining", "icon": "utensils", "color": "#F59E0B", "category_type": "EXPENSE"},
    {"name": "Groceries", "slug": "groceries", "icon": "shopping-cart", "color": "#10B981", "category_type": "EXPENSE"},
    {"name": "Transportation", "slug": "transportation", "icon": "car", "color": "#3B82F6", "category_type": "EXPENSE"},
    {"name": "Fuel", "slug": "fuel", "icon": "fuel", "color": "#EF4444", "category_type": "EXPENSE"},
    {"name": "Shopping", "slug": "shopping", "icon": "shopping-bag", "color": "#EC4899", "category_type": "EXPENSE"},
    {"name": "College Fees & Education", "slug": "education", "icon": "graduation-cap", "color": "#8B5CF6", "category_type": "EXPENSE"},
    {"name": "Books & Stationery", "slug": "books-stationery", "icon": "book-open", "color": "#6366F1", "category_type": "EXPENSE"},
    {"name": "Entertainment", "slug": "entertainment", "icon": "film", "color": "#A855F7", "category_type": "EXPENSE"},
    {"name": "Mobile & Internet", "slug": "mobile-internet", "icon": "smartphone", "color": "#06B6D4", "category_type": "EXPENSE"},
    {"name": "Electricity & Utilities", "slug": "utilities", "icon": "zap", "color": "#F97316", "category_type": "EXPENSE"},
    {"name": "Rent & Housing", "slug": "rent-housing", "icon": "home", "color": "#14B8A6", "category_type": "EXPENSE"},
    {"name": "Healthcare", "slug": "healthcare", "icon": "activity", "color": "#E11D48", "category_type": "EXPENSE"},
    {"name": "Personal Care", "slug": "personal-care", "icon": "sparkles", "color": "#F43F5E", "category_type": "EXPENSE"},
    {"name": "Travel & Outings", "slug": "travel", "icon": "map-pin", "color": "#2563EB", "category_type": "EXPENSE"},
    {"name": "Subscriptions", "slug": "subscriptions", "icon": "tv", "color": "#9333EA", "category_type": "EXPENSE"},
    {"name": "Loan EMIs", "slug": "loan-emis", "icon": "credit-card", "color": "#475569", "category_type": "EXPENSE"},
    {"name": "Investments & Savings", "slug": "investments", "icon": "trending-up", "color": "#059669", "category_type": "EXPENSE"},
    {"name": "Gifts & Donations", "slug": "gifts", "icon": "gift", "color": "#D946EF", "category_type": "EXPENSE"},
    {"name": "Other Expenses", "slug": "other-expenses", "icon": "more-horizontal", "color": "#94A3B8", "category_type": "EXPENSE"},

    # Income categories
    {"name": "Salary", "slug": "salary", "icon": "briefcase", "color": "#10B981", "category_type": "INCOME"},
    {"name": "Freelance & Consulting", "slug": "freelance", "icon": "laptop", "color": "#3B82F6", "category_type": "INCOME"},
    {"name": "Pocket Money / Allowance", "slug": "allowance", "icon": "wallet", "color": "#F59E0B", "category_type": "INCOME"},
    {"name": "Investment Returns", "slug": "investment-returns", "icon": "trending-up", "color": "#059669", "category_type": "INCOME"},
    {"name": "Refunds & Cashbacks", "slug": "refunds-cashback", "icon": "rotate-ccw", "color": "#06B6D4", "category_type": "INCOME"},
    {"name": "Other Income", "slug": "other-income", "icon": "plus-circle", "color": "#64748B", "category_type": "INCOME"},
]

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed categories
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Category).where(Category.is_system == True))
        existing = result.scalars().all()
        if not existing:
            for item in DEFAULT_SYSTEM_CATEGORIES:
                cat = Category(
                    id=str(uuid.uuid4()),
                    user_id=None,
                    name=item["name"],
                    slug=item["slug"],
                    icon=item["icon"],
                    color=item["color"],
                    category_type=item["category_type"],
                    is_system=True
                )
                session.add(cat)
            await session.commit()
