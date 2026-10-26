import asyncio
import sys
import uuid

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from datetime import datetime, timedelta, timezone, date
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.init_db import init_db
from app.core.security import get_password_hash
from app.models.user import User, UserPreferences
from app.models.account import Account
from app.models.category import Category
from app.models.budget import Budget
from app.models.goal import SavingsGoal
from app.models.recurring import RecurringExpense
from app.services.ledger_service import LedgerService, inr_to_paise
from app.schemas.transaction import TransactionCreate

async def seed():
    print("🌱 Initializing Database Schema...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if demo user already exists
        res = await session.execute(select(User).where(User.email == "demo@smartspend.ai"))
        if res.scalar_one_or_none():
            print("ℹ️ Demo user already exists. Skipping seed.")
            return

        print("👤 Creating Demo User: demo@smartspend.ai ...")
        user_id = str(uuid.uuid4())
        user = User(
            id=user_id,
            email="demo@smartspend.ai",
            password_hash=get_password_hash("Password123!"),
            full_name="Aarav Sharma",
            phone="+91 98765 43210",
            is_active=True,
            is_verified=True
        )
        session.add(user)

        prefs = UserPreferences(
            id=str(uuid.uuid4()),
            user_id=user_id,
            currency="INR",
            date_format="DD/MM/YYYY",
            timezone="Asia/Kolkata",
            theme="dark"
        )
        session.add(prefs)

        # Accounts
        acc_bank = Account(id=str(uuid.uuid4()), user_id=user_id, name="HDFC Salary Account", account_type="BANK", mask_account_number="XX4912", current_balance_paise=inr_to_paise(85400.0))
        acc_wallet = Account(id=str(uuid.uuid4()), user_id=user_id, name="Paytm / PhonePe UPI Wallet", account_type="WALLET", current_balance_paise=inr_to_paise(3420.0))
        acc_cash = Account(id=str(uuid.uuid4()), user_id=user_id, name="Cash in Hand", account_type="CASH", current_balance_paise=inr_to_paise(1500.0))
        session.add_all([acc_bank, acc_wallet, acc_cash])

        await session.commit()

        # Load categories
        cats_res = await session.execute(select(Category))
        categories = {c.slug: c for c in cats_res.scalars().all()}

        # Seed transactions
        now = datetime.now()
        demo_txns = [
            # Income
            {"desc": "Monthly Salary - Tech Corp", "amt": 85000.0, "type": "INCOME", "cat": "salary", "days_ago": 20, "pm": "NETBANKING", "ref": "NEFT8492019482"},
            {"desc": "Freelance UI Consulting", "amt": 18000.0, "type": "INCOME", "cat": "freelance", "days_ago": 12, "pm": "UPI", "ref": "UPI1948201840"},
            
            # Expenses
            {"desc": "Swiggy - Gourmet Dinner", "amt": 840.0, "type": "EXPENSE", "cat": "food-dining", "days_ago": 1, "merchant": "Swiggy", "pm": "UPI", "ref": "UPI9482018491"},
            {"desc": "Starbucks Coffee & Croissant", "amt": 420.0, "type": "EXPENSE", "cat": "food-dining", "days_ago": 2, "merchant": "Starbucks", "pm": "UPI", "ref": "UPI8391048201"},
            {"desc": "Zepto Quick Delivery Groceries", "amt": 640.0, "type": "EXPENSE", "cat": "groceries", "days_ago": 3, "merchant": "Zepto", "pm": "UPI", "ref": "UPI2948103948"},
            {"desc": "Blinkit Household Staples", "amt": 1580.0, "type": "EXPENSE", "cat": "groceries", "days_ago": 7, "merchant": "Blinkit", "pm": "UPI", "ref": "UPI4918204918"},
            {"desc": "Uber to Indiranagar Office", "amt": 260.0, "type": "EXPENSE", "cat": "transportation", "days_ago": 4, "merchant": "Uber", "pm": "UPI", "ref": "UPI8491048203"},
            {"desc": "Shell Petrol Station Fuel", "amt": 2100.0, "type": "EXPENSE", "cat": "fuel", "days_ago": 8, "merchant": "Shell", "pm": "DEBIT_CARD", "ref": "POS9481029"},
            {"desc": "Myntra Festive Apparel Sale", "amt": 3250.0, "type": "EXPENSE", "cat": "shopping", "days_ago": 10, "merchant": "Myntra", "pm": "UPI", "ref": "UPI7491028491"},
            {"desc": "Bescom Electricity Bill Payment", "amt": 1850.0, "type": "EXPENSE", "cat": "utilities", "days_ago": 15, "merchant": "Bescom", "pm": "UPI", "ref": "UPI6391048291"},
            {"desc": "JioFiber Monthly Broadband Plan", "amt": 1179.0, "type": "EXPENSE", "cat": "mobile-internet", "days_ago": 16, "merchant": "Jio", "pm": "UPI", "ref": "UPI5391048291"},
            {"desc": "Netflix India Premium Subscription", "amt": 649.0, "type": "EXPENSE", "cat": "subscriptions", "days_ago": 18, "merchant": "Netflix", "pm": "CREDIT_CARD", "ref": "AUTO849102"},
            {"desc": "Cult.fit Fitness Gym Pass", "amt": 2400.0, "type": "EXPENSE", "cat": "healthcare", "days_ago": 22, "merchant": "Cult.fit", "pm": "UPI", "ref": "UPI4391048291"},
            {"desc": "Chai Point Evening Snacks", "amt": 160.0, "type": "EXPENSE", "cat": "food-dining", "days_ago": 5, "merchant": "Chai Point", "pm": "UPI", "ref": "UPI3391048291"},

            # Refund test case
            {"desc": "Swiggy Order Out of Stock Refund", "amt": 420.0, "type": "REFUND", "cat": "food-dining", "days_ago": 2, "merchant": "Swiggy", "pm": "UPI", "ref": "REF8491029481"},
        ]

        print("💳 Seeding verified transactions...")
        for item in demo_txns:
            cat_obj = categories.get(item["cat"])
            txn_dt = now - timedelta(days=item["days_ago"], hours=item["days_ago"] % 5)
            txn_data = TransactionCreate(
                amount_inr=item["amt"],
                transaction_type=item["type"],
                transaction_date=txn_dt,
                description=item["desc"],
                merchant_name=item.get("merchant"),
                category_id=cat_obj.id if cat_obj else None,
                account_id=acc_bank.id if item["type"] == "INCOME" else acc_wallet.id,
                payment_method=item["pm"],
                payment_source="PHONEPE",
                reference_utr=item.get("ref")
            )
            await LedgerService.create_transaction(session, user_id, txn_data)

        # Seed Budgets
        print("🎯 Seeding Budgets...")
        food_cat = categories.get("food-dining")
        shop_cat = categories.get("shopping")
        
        # Overall budget: 40,000 INR
        b_overall = Budget(
            id=str(uuid.uuid4()), user_id=user_id, category_id=None,
            period="MONTHLY", limit_amount_paise=inr_to_paise(45000.0), is_active=True
        )
        b_food = Budget(
            id=str(uuid.uuid4()), user_id=user_id, category_id=food_cat.id if food_cat else None,
            period="MONTHLY", limit_amount_paise=inr_to_paise(6000.0), is_active=True
        )
        b_shop = Budget(
            id=str(uuid.uuid4()), user_id=user_id, category_id=shop_cat.id if shop_cat else None,
            period="MONTHLY", limit_amount_paise=inr_to_paise(8000.0), is_active=True
        )
        session.add_all([b_overall, b_food, b_shop])

        # Seed Savings Goals
        print("🏆 Seeding Savings Goals...")
        g1 = SavingsGoal(
            id=str(uuid.uuid4()), user_id=user_id,
            title="Emergency Buffer Fund (6 Months)",
            target_amount_paise=inr_to_paise(180000.0),
            current_amount_paise=inr_to_paise(75000.0),
            target_date=date(now.year + 1, 3, 31),
            status="IN_PROGRESS",
            notes="3 to 6 months of fixed living expenses"
        )
        g2 = SavingsGoal(
            id=str(uuid.uuid4()), user_id=user_id,
            title="Apple MacBook Air M3",
            target_amount_paise=inr_to_paise(115000.0),
            current_amount_paise=inr_to_paise(45000.0),
            target_date=date(now.year, 12, 31),
            status="IN_PROGRESS",
            notes="Upgrading primary development workstation"
        )
        session.add_all([g1, g2])

        # Seed Subscriptions
        print("🔄 Seeding Recurring Subscriptions...")
        sub_cat = categories.get("subscriptions")
        mob_cat = categories.get("mobile-internet")
        r1 = RecurringExpense(
            id=str(uuid.uuid4()), user_id=user_id, category_id=sub_cat.id if sub_cat else None,
            merchant_name="Netflix India 4K", expected_amount_paise=inr_to_paise(649.0),
            frequency="MONTHLY", next_due_date=date(now.year, now.month, 28),
            importance="OPTIONAL", is_active=True
        )
        r2 = RecurringExpense(
            id=str(uuid.uuid4()), user_id=user_id, category_id=mob_cat.id if mob_cat else None,
            merchant_name="JioFiber 100Mbps Home Broadband", expected_amount_paise=inr_to_paise(1179.0),
            frequency="MONTHLY", next_due_date=date(now.year, now.month, 25),
            importance="ESSENTIAL", is_active=True
        )
        session.add_all([r1, r2])

        await session.commit()
        print("✅ Demo data seeded successfully!")
        print("✨ Login credentials:")
        print("   Email: demo@smartspend.ai")
        print("   Password: Password123!")

if __name__ == "__main__":
    asyncio.run(seed())
