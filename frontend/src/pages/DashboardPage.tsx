import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardSummary, Transaction, CategorySpendItem, PaymentMethodBreakdown } from '../types';
import { formatINR, formatPercent, formatDateFriendly } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Percent, 
  PieChart as PieIcon, 
  Receipt, 
  Flame, 
  Calendar,
  ArrowUpRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardPageProps {
  onOpenAddTxn: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenAddTxn, onNavigateTab }) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, txnsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/transactions?limit=5')
      ]);
      setData(dashRes.data);
      setRecentTxns(txnsRes.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#64748B'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#061F17] via-[#0A1627] to-[#070B13] border border-emerald-500/25 text-white shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Financial Ledger • Paise Precision</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
            {data.period_label} Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time Indian Rupee transaction analytics, budgets, and savings tracking.
          </p>
        </div>
        <div className="relative z-10 flex items-center space-x-2.5">
          <button
            onClick={onOpenAddTxn}
            className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 active:scale-95 text-slate-950 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
          <button
            onClick={() => onNavigateTab('importer')}
            className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md transition-all"
          >
            <span>Import Statement</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Income */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Income</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatINR(data.total_income_inr)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            <span>Recorded deposits</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Expenses</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatINR(data.total_expenses_inr)}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span>Net of refunds</span>
          </div>
        </div>

        {/* Net Savings */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Net Savings</span>
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-lg sm:text-2xl font-bold ${data.net_savings_inr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatINR(data.net_savings_inr)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Income − Expenses
          </div>
        </div>

        {/* Savings Rate */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Savings Rate</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatPercent(data.savings_rate)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Target benchmark: 20%+
          </div>
        </div>

        {/* Remaining Monthly Budget */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Monthly Budget</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {data.remaining_monthly_budget_inr !== null && data.remaining_monthly_budget_inr !== undefined
              ? formatINR(data.remaining_monthly_budget_inr)
              : 'Not Configured'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {data.budget_usage_percent !== null && data.budget_usage_percent !== undefined
              ? `${data.budget_usage_percent}% used so far`
              : 'Click Budgets to set'}
          </div>
        </div>

        {/* Number of Transactions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Transactions</span>
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {data.transaction_count}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Logged this month
          </div>
        </div>

        {/* Largest Expense */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Largest Single Spend</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-500">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatINR(data.largest_expense_inr)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {data.largest_expense_merchant || 'None'}
          </div>
        </div>

        {/* Average Daily Spending */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Avg Daily Spend</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
            {formatINR(data.avg_daily_spending_inr)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Daily burn velocity
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Trend (Area Chart) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Cashflow Trendline</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Income vs. daily expense movements throughout the month</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {data.period_label}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day_label" 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false}
                  interval={4}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip 
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ 
                    backgroundColor: '#0D131F', 
                    borderColor: 'rgba(255, 255, 255, 0.12)', 
                    borderRadius: '0.875rem', 
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense_inr" 
                  name="Expenses" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="income_inr" 
                  name="Income" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Donut Chart) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Category Breakdown</h2>
              <span className="text-xs text-slate-400">{data.category_breakdown.length} Categories</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Where your expenses are concentrated</p>

            {data.category_breakdown.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.category_breakdown}
                      dataKey="total_inr"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {data.category_breakdown.map((_: CategorySpendItem, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                      contentStyle={{ 
                        backgroundColor: '#0D131F', 
                        borderColor: 'rgba(255, 255, 255, 0.12)', 
                        borderRadius: '0.875rem', 
                        color: '#F8FAFC',
                        fontSize: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No categorized spending this month.
              </div>
            )}
          </div>

          {/* Top Categories Progress Bars */}
          <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {data.category_breakdown.slice(0, 4).map((c: CategorySpendItem, i: number) => (
              <div key={i} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{c.category_name}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatINR(c.total_inr)} ({c.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, c.percentage)}%`, backgroundColor: COLORS[i % COLORS.length] }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment App / Source Distribution & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Payment Modes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Breakdown by UPI, Card, NetBanking & Cash</p>

          <div className="space-y-3">
            {data.payment_method_breakdown.length > 0 ? (
              data.payment_method_breakdown.map((pm: PaymentMethodBreakdown, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{pm.method}</span>
                    <span className="block text-[11px] text-slate-500">{pm.count} transactions</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{formatINR(pm.total_inr)}</span>
                    <span className="block text-[11px] text-emerald-600 dark:text-emerald-400">{pm.percentage}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">No payment methods recorded.</div>
            )}
          </div>
        </div>

        {/* Recent Transactions Snippet */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest recorded items in your ledger</p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All ({data.transaction_count}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTxns.length > 0 ? (
              recentTxns.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[11px] ${
                      t.transaction_type === 'INCOME'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : t.transaction_type === 'REFUND'
                        ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400'
                        : t.transaction_type === 'TRANSFER'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                    }`}>
                      {t.transaction_type === 'INCOME' ? '₹+' : t.transaction_type === 'REFUND' ? 'Ref' : t.transaction_type === 'TRANSFER' ? '⇄' : '₹-'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white text-xs block">{t.description}</span>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span>{formatDateFriendly(t.transaction_date)}</span>
                        <span>•</span>
                        <span>{t.payment_method}</span>
                        {t.category && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{t.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`font-bold text-sm ${
                    t.transaction_type === 'INCOME'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : t.transaction_type === 'REFUND'
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : t.transaction_type === 'TRANSFER'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {t.transaction_type === 'INCOME' ? '+' : t.transaction_type === 'REFUND' ? '+' : '-'} {formatINR(t.amount_inr)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent transactions. Click "Add Transaction" or "Import Statement" to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
