import csv
import io
import re
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.import_job import ImportJob
from app.services.ledger_service import compute_deduplication_hash, inr_to_paise, LedgerService
from app.schemas.transaction import TransactionCreate
from app.schemas.import_job import ParsedItemPreview, ImportPreviewResponse, ImportConfirmRequest

# Keyword dictionaries mapped to category slugs
KEYWORD_CATEGORY_RULES = {
    "food-dining": [
        "swiggy", "zomato", "mcdonald", "starbucks", "chai", "tea", "domino", "burger", 
        "kfc", "restaurant", "cafe", "dhaba", "pizza", "subway", "eatclub", "haldiram"
    ],
    "groceries": [
        "zepto", "blinkit", "instamart", "bigbasket", "dmart", "spencer", "nature basket", 
        "reliance fresh", "supermarket", "kirana", "provision", "milk", "vegetable"
    ],
    "transportation": [
        "uber", "ola", "rapido", "metro", "irctc", "railway", "redbus", "auto", "taxi", "bus"
    ],
    "fuel": [
        "indianoil", "hpcl", "bpcl", "petrol", "diesel", "fuel", "shell", "cng"
    ],
    "shopping": [
        "amazon", "flipkart", "myntra", "ajio", "nykaa", "tata cliq", "zara", "h&m", 
        "meesho", "decathlon", "lifestyle", "shoppers stop", "croma", "reliance digital"
    ],
    "subscriptions": [
        "netflix", "spotify", "hotstar", "prime video", "youtube", "apple", "google play", 
        "chatgpt", "midjourney", "patreon", "audible", "zee5", "sony liv"
    ],
    "mobile-internet": [
        "jio", "airtel", "vodafone", "vi ", "bsnl", "act fibernet", "hathway", "broadband"
    ],
    "utilities": [
        "electricity", "bescom", "tata power", "adani electricity", "mahadiscom", 
        "water board", "gas bill", "indane", "bharat gas"
    ],
    "education": [
        "college", "university", "school", "tuition", "fee", "coursera", "udemy", 
        "exam", "board", "institute"
    ],
    "books-stationery": [
        "book", "stationery", "xerox", "print", "crossword", "kindle"
    ],
    "healthcare": [
        "apollo", "pharmeasy", "1mg", "medplus", "hospital", "clinic", "dental", 
        "lab", "diagnostics", "practo"
    ],
    "salary": [
        "salary", "payroll", "wages", "stipend"
    ],
    "freelance": [
        "upwork", "fiverr", "freelance", "consulting", "invoice", "client"
    ],
}

def parse_date_flexible(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    s = str(val).strip()
    for fmt in [
        "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%Y %H:%M:%S", "%d-%m-%Y %H:%M:%S",
        "%d/%m/%Y %I:%M %p", "%d-%m-%Y %I:%M %p",
        "%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d %b %Y", "%d %B %Y",
        "%Y/%m/%d", "%m/%d/%Y"
    ]:
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None

def clean_amount(val: Any) -> float:
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return abs(float(val))
    s = str(val).replace("₹", "").replace(",", "").replace("Rs.", "").replace("INR", "").strip()
    try:
        return abs(float(s))
    except ValueError:
        return 0.0

class ImportService:
    @staticmethod
    async def preview_statement(
        db: AsyncSession,
        user_id: str,
        file_bytes: bytes,
        file_name: str,
        source_type: str = "PAYTM"
    ) -> ImportPreviewResponse:
        cats_res = await db.execute(select(Category))
        all_categories = cats_res.scalars().all()
        cat_by_slug = {c.slug: c for c in all_categories}

        rows: List[Dict[str, Any]] = []

        # Read CSV or Excel using pure Python libraries (no DLL dependency)
        if file_name.endswith(".xlsx") or file_name.endswith(".xls"):
            try:
                import openpyxl
                wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
                ws = wb.active
                data = list(ws.iter_rows(values_only=True))
                if data:
                    headers = [str(c).strip().lower() if c else f"col_{i}" for i, c in enumerate(data[0])]
                    for r in data[1:]:
                        if any(r):
                            rows.append(dict(zip(headers, r)))
            except Exception as e:
                raise ValueError(f"Failed to read Excel file: {str(e)}")
        else:
            # CSV parsing with pure Python
            text = None
            for enc in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
                try:
                    text = file_bytes.decode(enc)
                    break
                except UnicodeDecodeError:
                    continue
            if text is None:
                text = file_bytes.decode("utf-8", errors="replace")

            reader = csv.reader(io.StringIO(text))
            raw_lines = [line for line in reader if any(line)]
            if raw_lines:
                headers = [str(c).strip().lower() for c in raw_lines[0]]
                for line in raw_lines[1:]:
                    if any(line):
                        row_dict = {}
                        for i, h in enumerate(headers):
                            row_dict[h] = line[i] if i < len(line) else ""
                        rows.append(row_dict)

        if not rows:
            return ImportPreviewResponse(
                file_name=file_name,
                source_type=source_type,
                total_found=0,
                duplicate_count=0,
                new_count=0,
                items=[]
            )

        # Identify column headers from first row
        headers = list(rows[0].keys())
        date_col = next((c for c in headers if any(k in c for k in ["date", "time", "txndate"])), None)
        desc_col = next((c for c in headers if any(k in c for k in ["narration", "description", "details", "remark", "particulars", "paid to", "receiver"])), None)
        amount_col = next((c for c in headers if any(k in c for k in ["amount", "txn amount", "total"])), None)
        debit_col = next((c for c in headers if any(k in c for k in ["debit", "withdrawal", "spent"])), None)
        credit_col = next((c for c in headers if any(k in c for k in ["credit", "deposit", "received"])), None)
        type_col = next((c for c in headers if c in ["type", "cr/dr", "transaction type"]), None)
        ref_col = next((c for c in headers if any(k in c for k in ["utr", "ref", "reference", "order id", "txn id", "transaction id"])), None)

        parsed_items: List[ParsedItemPreview] = []
        duplicate_count = 0

        # Pre-fetch existing deduplication hashes
        existing_hashes_res = await db.execute(
            select(Transaction.deduplication_hash).where(Transaction.user_id == user_id)
        )
        existing_hashes = set(existing_hashes_res.scalars().all())

        for row in rows:
            dt = None
            if date_col and row.get(date_col):
                dt = parse_date_flexible(row[date_col])
            if not dt:
                dt = datetime.now()

            desc = "Transaction"
            if desc_col and row.get(desc_col):
                desc = str(row[desc_col]).strip()
            elif ref_col and row.get(ref_col):
                desc = f"Payment ref {row[ref_col]}"

            amount = 0.0
            txn_type = "EXPENSE"

            if debit_col and row.get(debit_col) and clean_amount(row[debit_col]) > 0:
                amount = clean_amount(row[debit_col])
                txn_type = "EXPENSE"
            elif credit_col and row.get(credit_col) and clean_amount(row[credit_col]) > 0:
                amount = clean_amount(row[credit_col])
                txn_type = "INCOME"
            elif amount_col and row.get(amount_col):
                amount = clean_amount(row[amount_col])
                if type_col and row.get(type_col):
                    t_str = str(row[type_col]).strip().upper()
                    if any(k in t_str for k in ["CR", "CREDIT", "RECEIVED", "DEPOSIT"]):
                        txn_type = "INCOME"
                    elif "REFUND" in t_str:
                        txn_type = "REFUND"
                    else:
                        txn_type = "EXPENSE"

            if amount <= 0.0:
                continue

            ref_val = None
            if ref_col and row.get(ref_col):
                ref_val = str(row[ref_col]).strip()

            merchant, cat_id, cat_name, confidence = ImportService._classify_transaction(
                desc=desc,
                txn_type=txn_type,
                cat_by_slug=cat_by_slug
            )

            amt_paise = inr_to_paise(amount)
            d_hash = compute_deduplication_hash(
                user_id=user_id,
                transaction_date=dt,
                amount_paise=amt_paise,
                merchant_name=merchant,
                reference_utr=ref_val,
                description=desc
            )

            is_dup = d_hash in existing_hashes
            if is_dup:
                duplicate_count += 1

            parsed_items.append(
                ParsedItemPreview(
                    temp_id=str(uuid.uuid4()),
                    date=dt.strftime("%Y-%m-%d %H:%M"),
                    amount_inr=amount,
                    transaction_type=txn_type,
                    description=desc,
                    merchant_name=merchant,
                    suggested_category_id=cat_id,
                    suggested_category_name=cat_name,
                    confidence_score=confidence,
                    payment_method="UPI",
                    payment_source=source_type.upper(),
                    reference_utr=ref_val,
                    is_duplicate=is_dup
                )
            )

        new_count = len(parsed_items) - duplicate_count

        return ImportPreviewResponse(
            file_name=file_name,
            source_type=source_type,
            total_found=len(parsed_items),
            duplicate_count=duplicate_count,
            new_count=new_count,
            items=parsed_items
        )

    @staticmethod
    def _classify_transaction(
        desc: str,
        txn_type: str,
        cat_by_slug: Dict[str, Category]
    ) -> Tuple[Optional[str], Optional[str], Optional[str], float]:
        desc_lower = desc.lower()

        if txn_type == "INCOME":
            for slug in ["salary", "freelance"]:
                for kw in KEYWORD_CATEGORY_RULES.get(slug, []):
                    if kw in desc_lower:
                        cat = cat_by_slug.get(slug)
                        return (kw.title(), cat.id if cat else None, cat.name if cat else slug.title(), 0.90)
            cat = cat_by_slug.get("other-income")
            return ("Income Credit", cat.id if cat else None, cat.name if cat else "Other Income", 0.50)

        for slug, keywords in KEYWORD_CATEGORY_RULES.items():
            for kw in keywords:
                if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower) or kw in desc_lower:
                    cat = cat_by_slug.get(slug)
                    confidence = 0.95 if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower) else 0.80
                    return (kw.title(), cat.id if cat else None, cat.name if cat else slug.title(), confidence)

        cat = cat_by_slug.get("other-expenses")
        return (None, cat.id if cat else None, cat.name if cat else "Other Expenses", 0.35)

    @staticmethod
    async def confirm_import(
        db: AsyncSession,
        user_id: str,
        data: ImportConfirmRequest
    ) -> ImportJob:
        job = ImportJob(
            id=str(uuid.uuid4()),
            user_id=user_id,
            source_type=data.source_type.upper(),
            file_name=data.file_name,
            total_records=len(data.items),
            imported_records=0,
            duplicate_records=0,
            status="PROCESSING"
        )
        db.add(job)
        await db.flush()

        imported_count = 0
        duplicate_count = 0

        for item in data.items:
            try:
                txn_in = TransactionCreate(
                    amount_inr=item.amount_inr,
                    transaction_type=item.transaction_type,
                    transaction_date=item.transaction_date,
                    description=item.description,
                    merchant_name=item.merchant_name,
                    category_id=item.category_id,
                    payment_method=item.payment_method,
                    payment_source=item.payment_source or data.source_type,
                    reference_utr=item.reference_utr,
                    notes=item.notes
                )
                await LedgerService.create_transaction(
                    db=db,
                    user_id=user_id,
                    data=txn_in,
                    import_job_id=job.id
                )
                imported_count += 1
            except ValueError:
                duplicate_count += 1
                continue

        job.imported_records = imported_count
        job.duplicate_records = duplicate_count
        job.status = "COMPLETED"
        await db.commit()
        await db.refresh(job)
        return job
