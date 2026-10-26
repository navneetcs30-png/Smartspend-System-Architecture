import pytest
import pytest_asyncio
import uuid
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
from datetime import datetime, timezone, date, timedelta
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.init_db import init_db
from app.services.ledger_service import inr_to_paise, paise_to_inr, compute_deduplication_hash
from app.models.user import User

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_db():
    await init_db()
    yield

@pytest.mark.asyncio
async def test_paise_conversion_accuracy():
    """Verify zero floating-point loss in paise conversion"""
    assert inr_to_paise(1.00) == 100
    assert inr_to_paise(240.50) == 24050
    assert inr_to_paise(0.01) == 1
    assert paise_to_inr(24050) == 240.50
    assert paise_to_inr(100) == 1.00

@pytest.mark.asyncio
async def test_user_registration_and_login():
    """Test user registration, token generation, and authenticated profile access"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"test_{uuid.uuid4().hex[:8]}@smartspend.ai"
        reg_payload = {
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Test User",
            "phone": "+91 99999 88888"
        }
        reg_resp = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert reg_resp.status_code == 201
        data = reg_resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

        # Test login
        login_resp = await ac.post("/api/v1/auth/login", json={"email": email, "password": "SecurePassword123!"})
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]

        # Test authenticated me
        me_resp = await ac.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == email

@pytest.mark.asyncio
async def test_transaction_creation_and_deduplication():
    """Test transaction creation and duplicate detection prevention"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"user_{uuid.uuid4().hex[:8]}@smartspend.ai"
        reg = await ac.post("/api/v1/auth/register", json={"email": email, "password": "Pass123!Password", "full_name": "Rohan"})
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        txn_payload = {
            "amount_inr": 340.0,
            "transaction_type": "EXPENSE",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Swiggy Lunch Biryani",
            "merchant_name": "Swiggy",
            "payment_method": "UPI",
            "payment_source": "PHONEPE",
            "reference_utr": "UPI999888111"
        }

        # 1. First creation must succeed
        res1 = await ac.post("/api/v1/transactions", json=txn_payload, headers=headers)
        assert res1.status_code == 201
        created = res1.json()
        assert created["amount_inr"] == 340.0
        assert created["amount_paise"] == 34000

        # 2. Second identical creation must be rejected as duplicate
        res2 = await ac.post("/api/v1/transactions", json=txn_payload, headers=headers)
        assert res2.status_code == 400
        assert "duplicate" in res2.json()["detail"].lower()

@pytest.mark.asyncio
async def test_transfer_and_refund_isolation():
    """Verify internal transfers don't inflate income/expense, and refunds offset expenses"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"transfer_{uuid.uuid4().hex[:8]}@smartspend.ai"
        reg = await ac.post("/api/v1/auth/register", json={"email": email, "password": "Pass123!Password", "full_name": "Priya"})
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch accounts
        accs_res = await ac.get("/api/v1/accounts", headers=headers)
        accs = accs_res.json()
        acc1 = accs[0]["id"]
        acc2 = accs[1]["id"]

        # 1. Log Income: 10,000 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 10000.0,
            "transaction_type": "INCOME",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Salary deposit",
            "account_id": acc1
        }, headers=headers)

        # 2. Log Expense: 1,000 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 1000.0,
            "transaction_type": "EXPENSE",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Dinner with friends",
            "account_id": acc1
        }, headers=headers)

        # 3. Log Transfer between own accounts: 2,000 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 2000.0,
            "transaction_type": "TRANSFER",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Bank to Paytm Wallet transfer",
            "account_id": acc1,
            "destination_account_id": acc2
        }, headers=headers)

        # 4. Log Refund: 200 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 200.0,
            "transaction_type": "REFUND",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Partial refund for food order",
            "account_id": acc1
        }, headers=headers)

        # Query Dashboard Summary
        dash = await ac.get("/api/v1/reports/dashboard", headers=headers)
        assert dash.status_code == 200
        summary = dash.json()

        # Net income should be 10000
        assert summary["total_income_inr"] == 10000.0
        # Effective expenses should be 1000 - 200 = 800 (Transfer not included!)
        assert summary["total_expenses_inr"] == 800.0
        # Net savings should be 10000 - 800 = 9200
        assert summary["net_savings_inr"] == 9200.0

@pytest.mark.asyncio
async def test_cross_tenant_isolation():
    """Verify that User A cannot access or modify User B's transaction"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register User A
        regA = await ac.post("/api/v1/auth/register", json={"email": f"a_{uuid.uuid4().hex[:6]}@smartspend.ai", "password": "Password123!", "full_name": "User A"})
        tokenA = regA.json()["access_token"]

        # Register User B
        regB = await ac.post("/api/v1/auth/register", json={"email": f"b_{uuid.uuid4().hex[:6]}@smartspend.ai", "password": "Password123!", "full_name": "User B"})
        tokenB = regB.json()["access_token"]

        # User A creates a transaction
        txA = await ac.post("/api/v1/transactions", json={
            "amount_inr": 500.0,
            "transaction_type": "EXPENSE",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "User A Private Expense"
        }, headers={"Authorization": f"Bearer {tokenA}"})
        txn_id = txA.json()["id"]

        # User B attempts to fetch User A's transaction
        get_b = await ac.get(f"/api/v1/transactions/{txn_id}", headers={"Authorization": f"Bearer {tokenB}"})
        assert get_b.status_code == 404

        # User B attempts to delete User A's transaction
        del_b = await ac.delete(f"/api/v1/transactions/{txn_id}", headers={"Authorization": f"Bearer {tokenB}"})
        assert del_b.status_code == 404

@pytest.mark.asyncio
async def test_ai_analyst_deterministic_response():
    """Test that the AI analyst answers using real data without hallucinating"""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = f"ai_{uuid.uuid4().hex[:6]}@smartspend.ai"
        reg = await ac.post("/api/v1/auth/register", json={"email": email, "password": "Password123!", "full_name": "AI Tester"})
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Add a specific transaction
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 750.0,
            "transaction_type": "EXPENSE",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Dinner at Barbeque Nation",
            "merchant_name": "Barbeque Nation"
        }, headers=headers)

        # Query AI analyst
        ai_resp = await ac.post("/api/v1/ai/chat", json={"message": "Where did my money go this month?"}, headers=headers)
        assert ai_resp.status_code == 200
        body = ai_resp.json()
        assert "750" in body["response"]
