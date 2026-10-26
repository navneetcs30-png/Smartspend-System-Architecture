import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SavingsGoal } from '../types';
import { formatINR, formatDate, formatPercent } from '../utils/formatters';
import { AddGoalModal } from '../components/goals/AddGoalModal';
import { ContributeModal } from '../components/goals/ContributeModal';
import { 
  Target, 
  Plus, 
  Calendar, 
  Trash2
} from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this savings goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      loadGoals();
    } catch {
      alert('Failed to delete goal.');
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set targets, record deposits, and track monthly required contributions
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length > 0 ? (
          goals.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{g.title}</h3>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Target: {formatDate(g.target_date)} ({g.days_left} days left)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      g.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400'
                    }`}>
                      {g.status === 'COMPLETED' ? 'COMPLETED' : `${formatPercent(g.progress_percentage)}`}
                    </span>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {formatINR(g.current_amount_inr)}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      of {formatINR(g.target_amount_inr)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatINR(g.remaining_amount_inr)} to go
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden mb-4">
                  <div
                    className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                  />
                </div>
              </div>

              {/* Monthly Contribution Required & Deposit Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold tracking-wider block">
                    Required Monthly Savings
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {formatINR(g.monthly_savings_needed_inr)}/month
                  </span>
                </div>

                {g.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setSelectedGoal(g)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Add Deposit</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Savings Goals Configured</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Track targets for emergency funds, tech upgrades, or travel. SmartSpend calculates the exact monthly contribution needed.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow"
            >
              Create First Goal
            </button>
          </div>
        )}
      </div>

      <AddGoalModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadGoals}
      />

      <ContributeModal
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onSuccess={loadGoals}
      />
    </div>
  );
};
