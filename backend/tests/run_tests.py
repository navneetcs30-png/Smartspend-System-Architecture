import asyncio
import sys
import uuid
from datetime import datetime, timezone

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.init_db import init_db
from app.services.ledger_service import inr_to_paise, paise_to_inr

async def run_all_tests():
    print("=" * 60)
    print("🧪 SmartSpend AI Automated Test Suite Execution")
    print("=" * 60)
    
    await init_db()

    # Test 1: Paise exact math
    print("\n[TEST 1] Verifying Paise Arithmetic Precision...")
    assert inr_to_paise(1.00) == 100, "1.00 INR must equal 100 paise"
    assert inr_to_paise(240.50) == 24050, "240.50 INR must equal 24050 paise"
    assert inr_to_paise(0.01) == 1, "0.01 INR must equal 1 paise"
    assert paise_to_inr(24050) == 240.50, "24050 paise must equal 240.50 INR"
    print("  ✅ Paise to INR and INR to Paise conversions passed with zero rounding drift.")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test 2: User registration, login, and auth token
        print("\n[TEST 2] Testing User Registration and JWT Auth Engine...")
        email = f"runner_{uuid.uuid4().hex[:6]}@smartspend.ai"
        reg = await ac.post("/api/v1/auth/register", json={
            "email": email,
            "password": "Password123!",
            "full_name": "Test Runner",
            "phone": "+91 91234 56789"
        })
        assert reg.status_code == 201, f"Registration failed: {reg.text}"
        data = reg.json()
        token = data["access_token"]
        assert token, "JWT access token must be returned"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test authenticated /me
        me = await ac.get("/api/v1/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["email"] == email
        print(f"  ✅ Registration & JWT authorization passed for user: {email}")

        # Test 3: Transaction creation & duplicate prevention
        print("\n[TEST 3] Testing Transaction Creation & Idempotent Deduplication...")
        txn_data = {
            "amount_inr": 450.0,
            "transaction_type": "EXPENSE",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Starbucks Coffee & Muffin",
            "merchant_name": "Starbucks",
            "payment_method": "UPI",
            "payment_source": "PHONEPE",
            "reference_utr": "UTR123456789"
        }
        res1 = await ac.post("/api/v1/transactions", json=txn_data, headers=headers)
        assert res1.status_code == 201, f"Create transaction failed: {res1.text}"
        created = res1.json()
        assert created["amount_paise"] == 45000
        assert created["amount_inr"] == 450.0
        
        # Attempt identical duplicate
        res2 = await ac.post("/api/v1/transactions", json=txn_data, headers=headers)
        assert res2.status_code == 400, "Duplicate transaction must be rejected with 400 Bad Request"
        print("  ✅ Transaction creation and duplicate rejection passed.")

        # Test 4: Internal Transfer and Refund Isolation
        print("\n[TEST 4] Testing Internal Transfers and Refund Isolation...")
        accs_res = await ac.get("/api/v1/accounts", headers=headers)
        accs = accs_res.json()
        acc1 = accs[0]["id"]
        acc2 = accs[1]["id"]

        # Deposit salary 50,000 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 50000.0,
            "transaction_type": "INCOME",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Monthly Salary",
            "account_id": acc1
        }, headers=headers)

        # Expense 2,000 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 2000.0,
            "transaction_type": "EXPENSE",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Electronics purchase",
            "account_id": acc1
        }, headers=headers)

        # Internal transfer between own accounts 5,000 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 5000.0,
            "transaction_type": "TRANSFER",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Move funds to wallet",
            "account_id": acc1,
            "destination_account_id": acc2
        }, headers=headers)

        # Refund 500 INR
        await ac.post("/api/v1/transactions", json={
            "amount_inr": 500.0,
            "transaction_type": "REFUND",
            "transaction_date": datetime.now(timezone.utc).isoformat(),
            "description": "Refund for returned cable",
            "account_id": acc1
        }, headers=headers)

        dash = await ac.get("/api/v1/reports/dashboard", headers=headers)
        assert dash.status_code == 200
        summary = dash.json()

        assert summary["total_income_inr"] == 50000.0
        # Total effective expenses = 450 (from test 3) + 2000 - 500 = 1950.0
        assert summary["total_expenses_inr"] == 1950.0
        # Transfer was strictly excluded from income and expenses!
        assert summary["net_savings_inr"] == 48050.0
        print(f"  ✅ Financial Isolation verified: Total Income: ₹{summary['total_income_inr']}, Net Expenses: ₹{summary['total_expenses_inr']}, Net Savings: ₹{summary['net_savings_inr']}")

        # Test 5: Multi-Tenant Data Isolation
        print("\n[TEST 5] Testing Multi-Tenant Data Isolation (Cross-User Breach Prevention)...")
        other_user = f"other_{uuid.uuid4().hex[:6]}@smartspend.ai"
        reg_other = await ac.post("/api/v1/auth/register", json={
            "email": other_user,
            "password": "Password123!",
            "full_name": "Other User"
        })
        token_other = reg_other.json()["access_token"]
        headers_other = {"Authorization": f"Bearer {token_other}"}

        # Other user tries to access user 1's transaction
        breach_attempt = await ac.get(f"/api/v1/transactions/{created['id']}", headers=headers_other)
        assert breach_attempt.status_code == 404, "Cross-user record access must return 404 Not Found"
        print("  ✅ Multi-tenant isolation verified: User B cannot access User A's financial record.")

        # Test 6: AI Spending Analyst Query Engine
        print("\n[TEST 6] Testing AI Spending Analyst Query & Deterministic Answers...")
        ai_resp = await ac.post("/api/v1/ai/chat", json={"message": "Where did my money go this month?"}, headers=headers)
        assert ai_resp.status_code == 200
        ai_data = ai_resp.json()
        assert "1,950" in ai_data["response"] or "1950" in ai_data["response"], "AI must accurately state the exact verified expense total"
        print(f"  ✅ AI Analyst response: {ai_data['response'][:120]}...")

    print("\n" + "=" * 60)
    print("🎉 ALL 6 COMPREHENSIVE TEST SUITES PASSED FLAWLESSLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_all_tests())
