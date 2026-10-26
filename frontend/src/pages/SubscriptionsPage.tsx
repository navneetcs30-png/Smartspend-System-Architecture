import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RecurringExpense } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { AddRecurringModal } from '../components/recurring/AddRecurringModal';
import { 
  Repeat, 
  Plus, 
  Trash2, 
  Calendar, 
  Tv
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recurring');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this subscription tracker?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      loadSubscriptions();
    } catch {
      alert('Failed to delete subscription.');
    }
  };

  const totalMonthly = items.reduce((acc, curr) => {
    return acc + (curr.frequency === 'MONTHLY' ? curr.expected_amount_inr : curr.yearly_cost_inr / 12);
  }, 0);

  const totalYearly = items.reduce((acc, curr) => acc + curr.yearly_cost_inr, 0);

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Recurring Expenses & Subscriptions</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor periodic OTT, recharge, and gym commitments with annualized cost impact
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all"
        >
          <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Summary Cost Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block">Monthly Recurring Commitment</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatINR(totalMonthly)}/month
          </div>
          <p className="text-xs text-slate-400 mt-1">Committed to active subscriptions & bills</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-800 text-white shadow-xl">
          <span className="text-xs font-semibold text-indigo-300 block">Total Annualized Outflow</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {formatINR(totalYearly)}/year
          </div>
          <p className="text-xs text-indigo-200 mt-1">Total yearly cost across {items.length} services</p>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length > 0 ? (
          items.map((r) => (
            <div
              key={r.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{r.merchant_name}</h3>
                      <span className="text-[11px] text-slate-400">{r.category_name || 'Subscription'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.importance === 'ESSENTIAL'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {r.importance}
                    </span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatINR(r.expected_amount_inr)} <span className="text-xs text-slate-400 font-normal">/{r.frequency.toLowerCase()}</span>
                  </span>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {formatINR(r.yearly_cost_inr)}/yr
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Next charge: {formatDate(r.next_due_date)}</span>
                </div>
                <span className={`font-semibold ${r.days_until_due <= 3 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>
                  {r.days_until_due > 0 ? `in ${r.days_until_due} days` : 'Due today'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Repeat className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Recurring Payments Tracked</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Add your mobile broadband, Netflix, gym memberships, or rent to monitor annualized expenses and never miss renewal dates.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow"
            >
              Add First Service
            </button>
          </div>
        )}
      </div>

      <AddRecurringModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadSubscriptions}
      />
    </div>
  );
};
