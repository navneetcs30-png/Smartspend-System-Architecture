import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { formatINR, formatPercent } from '../utils/formatters';
import { 
  Calendar as CalendarIcon, 
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'MONTHLY' | 'DAILY'>('MONTHLY');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState<any | null>(null);
  const [monthlyData, setMonthlyData] = useState<any | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportType, selectedDate]);

  const loadReport = async () => {
    try {
      if (reportType === 'DAILY') {
        const res = await api.get(`/reports/daily?target_date=${selectedDate}`);
        setDailyData(res.data);
      } else {
        const res = await api.get('/reports/dashboard');
        setMonthlyData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/reports/export`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Financial Reports & Statements</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comprehensive daily and monthly spending analytics with comparative metrics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Daily / Monthly Toggle */}
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex text-xs font-semibold">
            <button
              onClick={() => setReportType('MONTHLY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                reportType === 'MONTHLY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly Summary
            </button>
            <button
              onClick={() => setReportType('DAILY')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                reportType === 'DAILY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Daily Breakdown
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {reportType === 'DAILY' ? (
        /* DAILY REPORT VIEW */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">Select Report Date:</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>

          {dailyData && (
            <>
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Income Received Today</span>
                  <div className="text-xl font-bold text-emerald-600 mt-1">
                    {formatINR(dailyData.total_income_inr)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Money Spent Today</span>
                  <div className="text-xl font-bold text-red-600 mt-1">
                    {formatINR(dailyData.total_expenses_inr)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Net Daily Cash Flow</span>
                  <div className={`text-xl font-bold mt-1 ${dailyData.net_cashflow_inr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatINR(dailyData.net_cashflow_inr)}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500">Largest Transaction</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {formatINR(dailyData.largest_transaction_inr)}
                  </div>
                </div>
              </div>

              {/* Category Breakdown Today */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Daily Spending by Category</h3>
                {dailyData.categories.length > 0 ? (
                  <div className="space-y-3">
                    {dailyData.categories.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.category_name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formatINR(c.total_inr)} ({c.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No transactions recorded on {selectedDate}.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        /* MONTHLY REPORT VIEW */
        monthlyData && (
          <div className="space-y-6">
            {/* Cashflow Bar Chart */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">Monthly Cash Inflow vs. Outflow</h2>
              <p className="text-xs text-slate-500 mb-4">Comparing daily income deposits with expense outflows</p>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.daily_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day_label" stroke="#94A3B8" fontSize={11} interval={4} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip 
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '0.75rem', border: 'none', color: '#FFF' }}
                    />
                    <Legend />
                    <Bar dataKey="income_inr" name="Income Received" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense_inr" name="Expenses Spent" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Ratio Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Savings Rate Performance</span>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                  {formatPercent(monthlyData.savings_rate)}
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  {monthlyData.savings_rate >= 20 ? 'Exceeding target benchmark of 20%!' : 'Below recommended 20% savings rate.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">Budget Utilization</span>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">
                  {monthlyData.budget_usage_percent !== null ? `${monthlyData.budget_usage_percent}%` : 'N/A'}
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  {monthlyData.remaining_monthly_budget_inr !== null ? `${formatINR(monthlyData.remaining_monthly_budget_inr)} remaining` : 'No budget configured.'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">Daily Burn Velocity</span>
                <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-200 mt-1">
                  {formatINR(monthlyData.avg_daily_spending_inr)}/day
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                  Average expenditure per active day.
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
