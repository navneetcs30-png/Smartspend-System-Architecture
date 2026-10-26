import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BudgetOverview, BudgetProgress } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';
import { AddBudgetModal } from '../components/budgets/AddBudgetModal';
import { 
  PieChart as PieIcon, 
  Plus, 
  Trash2
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const [data, setData] = useState<BudgetOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets/progress');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      loadBudgets();
    } catch {
      alert('Failed to delete budget.');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Smart Budget Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set category & overall monthly spending limits with early warning thresholds
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          <span>Configure Budget</span>
        </button>
      </div>

      {/* Overall Budget KPI Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white border border-slate-700 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Combined Monthly Budget Health
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold mt-0.5">
              {formatINR(data.total_spent_inr)} <span className="text-slate-400 text-lg font-normal">/ {formatINR(data.total_budgeted_inr)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Overall Remaining</span>
            <span className="text-xl font-bold text-emerald-400">
              {formatINR(data.overall_remaining_inr)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              data.overall_percentage >= 100
                ? 'bg-red-500'
                : data.overall_percentage >= 85
                ? 'bg-amber-400'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, data.overall_percentage)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
          <span>{formatPercent(data.overall_percentage)} consumed</span>
          <span>Alerts configured at 50%, 75%, 90% and 100%</span>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.budgets.length > 0 ? (
          data.budgets.map((b: BudgetProgress) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${b.category_color}20`, color: b.category_color }}
                    >
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{b.category_name}</h3>
                      <span className="text-[11px] text-slate-400">{b.period} spending limit</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.alert_level === 'EXCEEDED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        : b.alert_level === 'CRITICAL_90'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                        : b.alert_level === 'WARNING_75'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}>
                      {b.alert_level === 'EXCEEDED' ? 'EXCEEDED' : `${b.percentage_used}%`}
                    </span>

                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatINR(b.spent_amount_inr)}
                  </span>
                  <span className="text-xs text-slate-400">
                    of {formatINR(b.limit_amount_inr)}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      b.percentage_used >= 100
                        ? 'bg-red-500'
                        : b.percentage_used >= 90
                        ? 'bg-orange-500'
                        : b.percentage_used >= 75
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentage_used)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Remaining Allowance</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatINR(b.remaining_amount_inr)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Projected End-of-Month</span>
                  <span className={`font-semibold ${b.projected_eom_spend_inr > b.limit_amount_inr ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {formatINR(b.projected_eom_spend_inr)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <PieIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Spending Budgets Configured</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Setting limits on high-frequency categories like Food, Dining, and Shopping helps prevent month-end cash flow surprises.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow"
            >
              Set First Budget
            </button>
          </div>
        )}
      </div>

      <AddBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadBudgets}
      />
    </div>
  );
};
