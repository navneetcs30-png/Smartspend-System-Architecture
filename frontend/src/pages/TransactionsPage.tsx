import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction, Category } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { 
  Search, 
  Download, 
  Plus, 
  Trash2
} from 'lucide-react';

interface TransactionsPageProps {
  onOpenAddTxn: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ onOpenAddTxn }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter, categoryFilter]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/transactions/categories');
      setCategories(res.data);
    } catch {
      // silent
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (typeFilter) params.txn_type = typeFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/transactions', { params });
      setTransactions(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      loadTransactions();
    } catch {
      alert('Failed to delete transaction.');
    }
  };

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/reports/export`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Ledger</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitor all Income, Expenses, Refunds & Transfers in Indian Rupees
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddTxn}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, merchant or UPI reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800"
            >
              Filter
            </button>
          </div>
        </form>

        {/* Type Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: '', label: 'All Records' },
            { id: 'EXPENSE', label: 'Expenses' },
            { id: 'INCOME', label: 'Income' },
            { id: 'REFUND', label: 'Refunds' },
            { id: 'TRANSFER', label: 'Transfers' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTypeFilter(item.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                typeFilter === item.id
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="text-[11px] text-slate-400 pl-2">
            Showing {transactions.length} of {total} records
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description & Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {formatDate(t.transaction_date)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(t.transaction_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {t.description}
                        </span>
                        {t.reference_utr && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                            UTR: {t.reference_utr}
                          </span>
                        )}
                      </div>
                      {t.merchant_name && (
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Merchant: {t.merchant_name}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {t.category ? (
                        <span 
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ 
                            backgroundColor: `${t.category.color}15`, 
                            color: t.category.color 
                          }}
                        >
                          {t.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Uncategorized</span>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div className="font-medium">{t.payment_method}</div>
                      {t.payment_source && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          via {t.payment_source}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
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
                      <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                        {t.transaction_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    {loading ? 'Loading transactions...' : 'No transactions found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-xs">
            <span className="text-slate-500">
              Page {page} of {pages}
            </span>
            <div className="flex space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
