import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ImportPreviewResponse, Category, ImportJob, ParsedItemPreview } from '../types';
import { formatINR } from '../utils/formatters';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  ShieldCheck
} from 'lucide-react';

export const ImporterPage: React.FC = () => {
  const [sourceType, setSourceType] = useState<'PAYTM' | 'PHONEPE' | 'GENERIC_BANK'>('PHONEPE');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [history, setHistory] = useState<ImportJob[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [committing, setCommitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadHistory();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.get('/transactions/categories');
      setCategories(res.data);
    } catch {
      // silent
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/imports/history');
      setHistory(res.data);
    } catch {
      // silent
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessMsg(null);
    }
  };

  const handleUploadPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV or Excel statement file.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);

    try {
      const res = await api.post('/imports/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process statement. Please ensure it is a valid format.');
    } finally {
      setUploading(false);
    }
  };

  const handleCategoryChange = (tempId: string, newCatId: string) => {
    if (!preview) return;
    const cat = categories.find((c) => c.id === newCatId);
    setPreview({
      ...preview,
      items: preview.items.map((item: ParsedItemPreview) =>
        item.temp_id === tempId
          ? {
              ...item,
              suggested_category_id: newCatId,
              suggested_category_name: cat?.name || 'Uncategorized',
            }
          : item
      ),
    });
  };

  const handleConfirmImport = async () => {
    if (!preview) return;
    setCommitting(true);
    setError(null);

    const itemsToImport = preview.items.map((item: ParsedItemPreview) => ({
      amount_inr: item.amount_inr,
      transaction_type: item.transaction_type,
      transaction_date: new Date(item.date).toISOString(),
      description: item.description,
      merchant_name: item.merchant_name,
      category_id: item.suggested_category_id,
      payment_method: item.payment_method,
      payment_source: item.payment_source,
      reference_utr: item.reference_utr,
    }));

    try {
      const res = await api.post('/imports/confirm', {
        source_type: preview.source_type,
        file_name: preview.file_name,
        items: itemsToImport,
      });

      setSuccessMsg(`Successfully imported ${res.data.imported_records} transactions to your ledger (${res.data.duplicate_records} duplicates safely skipped).`);
      setPreview(null);
      setFile(null);
      loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to import transactions.');
    } finally {
      setCommitting(false);
    }
  };

  const handleDownloadSampleCSV = () => {
    const sampleContent = `Date,Description,Amount,Type,UTR,Payment Method
2026-10-24 13:45,Swiggy Lunch Order,480.00,DEBIT,UPI8492019481,UPI
2026-10-23 18:20,Zepto Daily Grocery,720.00,DEBIT,UPI7391048291,UPI
2026-10-22 09:15,Uber Ride to Indiranagar,240.00,DEBIT,UPI6391048291,UPI
2026-10-21 20:00,Myntra Clothing Sale,1999.00,DEBIT,UPI5391048291,UPI
2026-10-20 11:30,Freelance Consulting Payment,15000.00,CREDIT,NEFT491029481,NETBANKING
2026-10-19 14:00,Starbucks Coffee,350.00,DEBIT,UPI3391048291,UPI
2026-10-18 16:30,Swiggy Cancelled Order Refund,480.00,REFUND,REF2391048291,UPI`;

    const blob = new Blob([sampleContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartspend_sample_${sourceType.toLowerCase()}_statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Authorized Statement Processing (Zero Credential Storage)</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Paytm, PhonePe & Bank Statement Importer
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Upload official exported statements (CSV or Excel) to reconcile transactions with automated duplicate detection.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Card */}
      {!preview && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Upload Statement File</h2>
            <button
              onClick={handleDownloadSampleCSV}
              className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Download Sample Statement CSV</span>
            </button>
          </div>

          <form onSubmit={handleUploadPreview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Statement Source
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'PHONEPE', name: 'PhonePe Export', sub: 'CSV / Excel' },
                  { id: 'PAYTM', name: 'Paytm Wallet / UPI', sub: 'CSV / Excel' },
                  { id: 'GENERIC_BANK', name: 'Indian Bank CSV', sub: 'HDFC, SBI, ICICI' },
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSourceType(s.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      sourceType === s.id
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm block">{s.name}</span>
                    <span className="text-[11px] text-slate-400">{s.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
              <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {file ? file.name : 'Choose a statement file (.csv, .xlsx)'}
              </div>
              <p className="text-xs text-slate-400 mt-1 mb-3">
                Exported from Paytm ("Download Statement") or PhonePe transaction history
              </p>
              <label className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 text-white cursor-pointer hover:bg-slate-800 shadow">
                Browse Files
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!file || uploading}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all disabled:opacity-50"
              >
                {uploading ? 'Processing File...' : 'Preview & Reconcile Transactions →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staging Preview */}
      {preview && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Reconciliation Preview: {preview.file_name}
              </h2>
              <p className="text-xs text-slate-500">
                Found {preview.total_found} entries • {preview.new_count} ready to import •{' '}
                <span className="text-amber-500 font-semibold">{preview.duplicate_count} duplicate records detected</span>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreview(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={committing || preview.items.length === 0}
                className="px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50"
              >
                {committing ? 'Importing...' : `Confirm & Commit (${preview.new_count} Records)`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Suggested Category</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {preview.items.map((item: ParsedItemPreview) => (
                  <tr 
                    key={item.temp_id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                      item.is_duplicate ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{item.date}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {item.description}
                      {item.reference_utr && (
                        <span className="block text-[10px] text-slate-400 font-mono">UTR: {item.reference_utr}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatINR(item.amount_inr)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.transaction_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <select
                        value={item.suggested_category_id || ''}
                        onChange={(e) => handleCategoryChange(item.temp_id, e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {Math.round(item.confidence_score * 100)}% confidence
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.is_duplicate ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400">
                          Duplicate
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                          Ready
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* History */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Previous Statement Imports</h3>
        <p className="text-xs text-slate-500 mb-4">Audit history of parsed files and duplicate metrics</p>

        {history.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {history.map((j) => (
              <div key={j.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{j.file_name || 'Statement Upload'}</span>
                    <span className="text-[11px] text-slate-400">Source: {j.source_type} • {new Date(j.created_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">+{j.imported_records} imported</span>
                  <span className="text-[11px] text-slate-400">{j.duplicate_records} duplicates skipped</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No statement files imported yet.
          </div>
        )}
      </div>
    </div>
  );
};
