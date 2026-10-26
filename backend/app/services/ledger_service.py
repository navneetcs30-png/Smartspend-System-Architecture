import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, delete
from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.models.audit import AuditLog
from app.schemas.transaction import TransactionCreate, TransactionUpdate

def compute_deduplication_hash(
    user_id: str,
    transaction_date: datetime,
    amount_paise: int,
    merchant_name: Optional[str],
    reference_utr: Optional[str],
    description: str
) -> str:
    """
    Computes a deterministic SHA-256 hash to prevent duplicate imports
    or accidental double submissions.
    """
    date_str = transaction_date.strftime("%Y-%m-%d")
    merchant_clean = (merchant_name or "").strip().lower()
    ref_clean = (reference_utr or "").strip().lower()
    desc_clean = description.strip().lower()
    raw = f"{user_id}|{date_str}|{amount_paise}|{merchant_clean}|{ref_clean}|{desc_clean[:30]}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def paise_to_inr(paise: int) -> float:
    return round(paise / 100.0, 2)

def inr_to_paise(inr: float) -> int:
    return int(round(inr * 100))

class LedgerService:
    @staticmethod
    async def create_transaction(
        db: AsyncSession,
        user_id: str,
        data: TransactionCreate,
        import_job_id: Optional[str] = None
    ) -> Transaction:
        amount_paise = inr_to_paise(data.amount_inr)
        
        # Validation for Transfer: destination_account_id is required and must differ from source
        if data.transaction_type == "TRANSFER":
            if not data.destination_account_id:
                raise ValueError("Destination account is required for an internal transfer.")
            if data.account_id and data.destination_account_id == data.account_id:
                raise ValueError("Source and destination accounts must be different for a transfer.")

        dedup_hash = compute_deduplication_hash(
            user_id=user_id,
            transaction_date=data.transaction_date,
            amount_paise=amount_paise,
            merchant_name=data.merchant_name,
            reference_utr=data.reference_utr,
            description=data.description
        )

        # Check for existing duplicate
        existing = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.user_id == user_id,
                    Transaction.deduplication_hash == dedup_hash
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Duplicate transaction detected. A transaction with identical details already exists.")

        txn = Transaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            account_id=data.account_id,
            destination_account_id=data.destination_account_id if data.transaction_type == "TRANSFER" else None,
            category_id=data.category_id,
            import_job_id=import_job_id,
            amount_paise=amount_paise,
            transaction_type=data.transaction_type.upper(),
            transaction_date=data.transaction_date,
            description=data.description.strip(),
            merchant_name=data.merchant_name.strip() if data.merchant_name else None,
            payment_method=data.payment_method.upper(),
            payment_source=data.payment_source.upper() if data.payment_source else None,
            reference_utr=data.reference_utr.strip() if data.reference_utr else None,
            deduplication_hash=dedup_hash,
            notes=data.notes,
            tags=data.tags,
            verification_status="VERIFIED"
        )
        db.add(txn)

        # Update account balances safely
        if data.account_id:
            src_acc = await db.get(Account, data.account_id)
            if src_acc and src_acc.user_id == user_id:
                if data.transaction_type == "INCOME" or data.transaction_type == "REFUND":
                    src_acc.current_balance_paise += amount_paise
                elif data.transaction_type == "EXPENSE" or data.transaction_type == "TRANSFER":
                    src_acc.current_balance_paise -= amount_paise

        if data.transaction_type == "TRANSFER" and data.destination_account_id:
            dest_acc = await db.get(Account, data.destination_account_id)
            if dest_acc and dest_acc.user_id == user_id:
                dest_acc.current_balance_paise += amount_paise

        # Audit log
        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            action="TXN_CREATE",
            entity_name="Transaction",
            entity_id=txn.id,
            new_values=f'{{"amount_inr": {data.amount_inr}, "type": "{data.transaction_type}", "desc": "{data.description}"}}'
        )
        db.add(audit)

        await db.commit()
        await db.refresh(txn)
        return txn

    @staticmethod
    async def get_transactions(
        db: AsyncSession,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        txn_type: Optional[str] = None,
        category_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Transaction], int, float, float, float]:
        query = select(Transaction).where(Transaction.user_id == user_id)

        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        if txn_type:
            query = query.where(Transaction.transaction_type == txn_type.upper())
        if category_id:
            query = query.where(Transaction.category_id == category_id)
        if search:
            search_pattern = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Transaction.description).like(search_pattern),
                    func.lower(Transaction.merchant_name).like(search_pattern),
                    func.lower(Transaction.reference_utr).like(search_pattern)
                )
            )

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Totals for income and expense in filtered set
        sum_income_q = select(func.coalesce(func.sum(Transaction.amount_paise), 0)).where(
            and_(Transaction.user_id == user_id, Transaction.transaction_type == "INCOME")
        )
        sum_expense_q = select(func.coalesce(func.sum(Transaction.amount_paise), 0)).where(
            and_(Transaction.user_id == user_id, Transaction.transaction_type == "EXPENSE")
        )
        # Offset expenses by refunds
        sum_refund_q = select(func.coalesce(func.sum(Transaction.amount_paise), 0)).where(
            and_(Transaction.user_id == user_id, Transaction.transaction_type == "REFUND")
        )

        income_paise = (await db.execute(sum_income_q)).scalar() or 0
        expense_paise = (await db.execute(sum_expense_q)).scalar() or 0
        refund_paise = (await db.execute(sum_refund_q)).scalar() or 0

        # Effective expenses = Expenses - Refunds
        effective_expense_paise = max(0, expense_paise - refund_paise)
        net_savings_paise = income_paise - effective_expense_paise

        # Fetch page items with category preloaded
        query = query.order_by(Transaction.transaction_date.desc()).offset((page - 1) * limit).limit(limit)
        res = await db.execute(query)
        items = res.scalars().all()

        return (
            items,
            total,
            paise_to_inr(income_paise),
            paise_to_inr(effective_expense_paise),
            paise_to_inr(net_savings_paise)
        )

    @staticmethod
    async def update_transaction(
        db: AsyncSession,
        user_id: str,
        txn_id: str,
        data: TransactionUpdate
    ) -> Transaction:
        res = await db.execute(
            select(Transaction).where(and_(Transaction.id == txn_id, Transaction.user_id == user_id))
        )
        txn = res.scalar_one_or_none()
        if not txn:
            raise ValueError("Transaction not found or access denied.")

        if data.amount_inr is not None:
            txn.amount_paise = inr_to_paise(data.amount_inr)
        if data.transaction_type is not None:
            txn.transaction_type = data.transaction_type.upper()
        if data.transaction_date is not None:
            txn.transaction_date = data.transaction_date
        if data.description is not None:
            txn.description = data.description.strip()
        if data.merchant_name is not None:
            txn.merchant_name = data.merchant_name.strip()
        if data.category_id is not None:
            txn.category_id = data.category_id
        if data.account_id is not None:
            txn.account_id = data.account_id
        if data.destination_account_id is not None:
            txn.destination_account_id = data.destination_account_id
        if data.payment_method is not None:
            txn.payment_method = data.payment_method.upper()
        if data.payment_source is not None:
            txn.payment_source = data.payment_source.upper()
        if data.reference_utr is not None:
            txn.reference_utr = data.reference_utr.strip()
        if data.notes is not None:
            txn.notes = data.notes
        if data.tags is not None:
            txn.tags = data.tags
        if data.verification_status is not None:
            txn.verification_status = data.verification_status

        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(txn)
        return txn

    @staticmethod
    async def delete_transaction(db: AsyncSession, user_id: str, txn_id: str) -> bool:
        res = await db.execute(
            select(Transaction).where(and_(Transaction.id == txn_id, Transaction.user_id == user_id))
        )
        txn = res.scalar_one_or_none()
        if not txn:
            return False

        # Revert account balance adjustment
        if txn.account_id:
            src_acc = await db.get(Account, txn.account_id)
            if src_acc and src_acc.user_id == user_id:
                if txn.transaction_type == "INCOME" or txn.transaction_type == "REFUND":
                    src_acc.current_balance_paise -= txn.amount_paise
                elif txn.transaction_type == "EXPENSE" or txn.transaction_type == "TRANSFER":
                    src_acc.current_balance_paise += txn.amount_paise

        if txn.transaction_type == "TRANSFER" and txn.destination_account_id:
            dest_acc = await db.get(Account, txn.destination_account_id)
            if dest_acc and dest_acc.user_id == user_id:
                dest_acc.current_balance_paise -= txn.amount_paise

        await db.delete(txn)
        await db.commit()
        return True
