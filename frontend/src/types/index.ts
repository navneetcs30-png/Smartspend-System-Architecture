export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  preferences?: {
    currency: string;
    date_format: string;
    timezone: string;
    theme: string;
    ai_insights_enabled: boolean;
    email_notifications: boolean;
  };
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  category_type: 'EXPENSE' | 'INCOME' | 'BOTH';
  is_system: boolean;
}

export interface Account {
  id: string;
  name: string;
  account_type: 'BANK' | 'WALLET' | 'CREDIT_CARD' | 'CASH';
  institution_name?: string;
  mask_account_number?: string;
  current_balance_paise: number;
  current_balance_inr: number;
  is_active: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount_paise: number;
  amount_inr: number;
  transaction_type: 'INCOME' | 'EXPENSE' | 'REFUND' | 'TRANSFER';
  transaction_date: string;
  description: string;
  merchant_name?: string;
  category_id?: string;
  category?: Category;
  account_id?: string;
  destination_account_id?: string;
  payment_method: string;
  payment_source?: string;
  reference_utr?: string;
  deduplication_hash: string;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'FLAGGED';
  notes?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  total_income_inr: number;
  total_expense_inr: number;
  net_savings_inr: number;
}

export interface CategorySpendItem {
  category_id?: string;
  category_name: string;
  color: string;
  icon: string;
  total_paise: number;
  total_inr: number;
  percentage: number;
  count: number;
}

export interface DailySpendTrendItem {
  date: string;
  day_label: string;
  expense_inr: number;
  income_inr: number;
  net_inr: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  total_inr: number;
  count: number;
  percentage: number;
}

export interface DashboardSummary {
  period_label: string;
  total_income_inr: number;
  total_expenses_inr: number;
  net_savings_inr: number;
  savings_rate: number;
  remaining_monthly_budget_inr?: number;
  total_monthly_budget_inr?: number;
  budget_usage_percent?: number;
  transaction_count: number;
  largest_expense_inr: number;
  largest_expense_merchant?: string;
  avg_daily_spending_inr: number;
  daily_trends: DailySpendTrendItem[];
  category_breakdown: CategorySpendItem[];
  payment_method_breakdown: PaymentMethodBreakdown[];
}

export interface BudgetProgress {
  id: string;
  category_id?: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  period: string;
  limit_amount_inr: number;
  spent_amount_inr: number;
  remaining_amount_inr: number;
  percentage_used: number;
  days_remaining: number;
  projected_eom_spend_inr: number;
  alert_level: 'NORMAL' | 'WARNING_75' | 'CRITICAL_90' | 'EXCEEDED';
  is_active: boolean;
}

export interface BudgetOverview {
  total_budgeted_inr: number;
  total_spent_inr: number;
  overall_remaining_inr: number;
  overall_percentage: number;
  budgets: BudgetProgress[];
}

export interface SavingsGoal {
  id: string;
  title: string;
  target_amount_inr: number;
  current_amount_inr: number;
  remaining_amount_inr: number;
  progress_percentage: number;
  target_date: string;
  days_left: number;
  monthly_savings_needed_inr: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  notes?: string;
  created_at: string;
}

export interface RecurringExpense {
  id: string;
  merchant_name: string;
  expected_amount_inr: number;
  frequency: string;
  yearly_cost_inr: number;
  next_due_date: string;
  days_until_due: number;
  importance: 'ESSENTIAL' | 'OPTIONAL' | 'LUXURY';
  is_active: boolean;
  category_id?: string;
  category_name?: string;
  created_at: string;
}

export interface ParsedItemPreview {
  temp_id: string;
  date: string;
  amount_inr: number;
  transaction_type: 'EXPENSE' | 'INCOME' | 'REFUND' | 'TRANSFER';
  description: string;
  merchant_name?: string;
  suggested_category_id?: string;
  suggested_category_name?: string;
  confidence_score: number;
  payment_method: string;
  payment_source: string;
  reference_utr?: string;
  is_duplicate: boolean;
}

export interface ImportPreviewResponse {
  file_name: string;
  source_type: string;
  total_found: number;
  duplicate_count: number;
  new_count: number;
  items: ParsedItemPreview[];
}

export interface ImportJob {
  id: string;
  source_type: string;
  file_name?: string;
  total_records: number;
  imported_records: number;
  duplicate_records: number;
  status: string;
  created_at: string;
}

export interface AIChatResponse {
  response: string;
  suggested_actions: string[];
  structured_metrics?: any;
}

export interface SpendingInsight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  potential_savings_inr: number;
  evidence_data: any;
  is_dismissed: boolean;
  is_applied: boolean;
  created_at: string;
}
