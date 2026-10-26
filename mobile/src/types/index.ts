export interface UserPreferences {
  id: string;
  user_id: string;
  currency: string;
  date_format: string;
  timezone: string;
  theme: string;
  ai_insights_enabled: boolean;
  email_notifications: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  preferences?: UserPreferences;
}

export interface Account {
  id: string;
  name: string;
  account_type: 'BANK' | 'WALLET' | 'CREDIT_CARD' | 'CASH';
  institution_name?: string;
  mask_account_number?: string;
  current_balance_paise: number;
  current_balance_inr?: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  category_type: 'EXPENSE' | 'INCOME' | 'BOTH';
  is_system: boolean;
}

export interface Transaction {
  id: string;
  account_id: string;
  category_id?: string;
  category?: Category;
  amount_paise: number;
  amount_inr?: number;
  transaction_type: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'REFUND';
  transaction_date: string;
  description: string;
  merchant_name?: string;
  payment_method: 'UPI' | 'NETBANKING' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CASH';
  payment_source?: string;
  reference_utr?: string;
  notes?: string;
  is_disputed: boolean;
  created_at: string;
}

export interface BudgetProgress {
  id: string;
  category_id: string;
  category_name: string;
  icon?: string;
  color?: string;
  budget_limit_inr: number;
  spent_inr: number;
  remaining_inr: number;
  percentage_used: number;
  status: 'HEALTHY' | 'WARNING' | 'EXCEEDED';
  projected_eom_inr: number;
  will_exceed: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount_inr: number;
  current_saved_inr: number;
  remaining_inr: number;
  percentage_achieved: number;
  target_date?: string;
  monthly_savings_needed_inr: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
}

export interface RecurringExpense {
  id: string;
  name: string;
  amount_inr: number;
  billing_cycle: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
  annual_cost_inr: number;
  next_renewal_date?: string;
  category_name: string;
  payment_method: string;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface CategorySpendItem {
  category_name: string;
  total_inr: number;
  percentage: number;
  count: number;
}

export interface DailyTrendItem {
  day_label: string;
  date: string;
  expense_inr: number;
  income_inr: number;
}

export interface DashboardSummary {
  period_label: string;
  total_income_inr: number;
  total_expenses_inr: number;
  net_savings_inr: number;
  savings_rate_percent: number;
  active_budgets_count: number;
  active_goals_count: number;
  avg_daily_spending_inr: number;
  projected_month_end_inr: number;
  category_breakdown: CategorySpendItem[];
  daily_trends: DailyTrendItem[];
}
