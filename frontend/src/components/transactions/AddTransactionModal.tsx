import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Category, Account } from '../../types';
import { X, ArrowRight, AlertCircle } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [txnType, setTxnType] = useState<'EXPENSE' | 'INCOME' | 'REFUND' | 'TRANSFER'>('EXPENSE');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [paymentSource, setPaymentSource] = useState<string>('PHONEPE');
  const [referenceUtr, setReferenceUtr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      setError(null);
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      const [catsRes, accsRes] = await Promise.all([
        api.get('/transactions/categories'),
        api.get('/accounts')
      ]);
      setCategories(catsRes.data);
      setAccounts(accsRes.data);
      if (accsRes.data.length > 0 && !accountId) {
        setAccountId(accsRes.data[0].id);
      }
    } catch {
      // silent
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount in INR.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (txnType === 'TRANSFER' && (!destinationAccountId || destinationAccountId === accountId)) {
      setError('Please select a different destination account for the transfer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/transactions', {
        amount_inr: parsedAmount,
        transaction_type: txnType,
        transaction_date: new Date().toISOString(),
        description: description.trim(),
        merchant_name: merchant.trim() || undefined,
        category_id: categoryId || undefined,
        account_id: accountId || undefined,
        destination_account_id: txnType === 'TRANSFER' ? destinationAccountId : undefined,
        payment_method: paymentMethod,
        payment_source: paymentSource,
        reference_utr: referenceUtr.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.trim() || undefined,
      });
      // Reset form
      setAmount('');
      setDescription('');
      setMerchant('');
      setReferenceUtr('');
      setNotes('');
      setTags('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (txnType === 'INCOME') return c.category_type === 'INCOME' || c.category_type === 'BOTH';
    return c.category_type === 'EXPENSE' || c.category_type === 'BOTH';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Transaction</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Supports UPI, NetBanking, Cards & Transfers</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 flex items-center space-x-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Transaction Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Transaction Type</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(['EXPENSE', 'INCOME', 'REFUND', 'TRANSFER'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTxnType(t)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    txnType === t
                      ? t === 'EXPENSE'
                        ? 'bg-red-600 text-white shadow-sm'
                        : t === 'INCOME'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : t === 'REFUND'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t === 'REFUND' ? 'Refund' : t === 'TRANSFER' ? 'Transfer' : t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Amount in INR */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Amount (₹ INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">₹</span>
              <input
                id="txn-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy Lunch, Uber to Metro"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Merchant / Payee
              </label>
              <input
                type="text"
                placeholder="e.g. Swiggy, Zepto, Netflix"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Dropdown (if not transfer) */}
          {txnType !== 'TRANSFER' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Select Category...</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Accounts (Source & Destination for Transfer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {txnType === 'TRANSFER' ? 'From Account' : 'Account / Wallet'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (₹{a.current_balance_inr.toFixed(0)})
                  </option>
                ))}
              </select>
            </div>

            {txnType === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  To Destination Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select Target...</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment Method & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="UPI">UPI</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="NETBANKING">NetBanking</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Payment App</label>
              <select
                value={paymentSource}
                onChange={(e) => setPaymentSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="PHONEPE">PhonePe</option>
                <option value="PAYTM">Paytm</option>
                <option value="GPAY">Google Pay</option>
                <option value="CRED">CRED</option>
                <option value="BHIM">BHIM</option>
                <option value="DIRECT">Direct Bank / Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">UPI Ref / UTR</label>
              <input
                type="text"
                placeholder="e.g. 401928491829"
                value={referenceUtr}
                onChange={(e) => setReferenceUtr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="submit-txn-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
