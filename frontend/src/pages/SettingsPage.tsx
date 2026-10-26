import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  Download, 
  Globe
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleExportData = () => {
    window.open(`${api.defaults.baseURL}/reports/export`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage your account profile, Indian regional settings, and financial data portability
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.full_name}</h2>
            <span className="text-xs text-slate-500">{user?.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Phone Number</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.phone || 'Not provided'}</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Account Status</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              Active & Verified
            </span>
          </div>
        </div>
      </div>

      {/* Indian Regional & Currency Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Indian Regional Settings</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Primary Currency</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">INR — Indian Rupee (₹)</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Stored as exact integer paise</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Date Format</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">DD/MM/YYYY</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Indian standard date format</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Timezone</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">Asia/Kolkata (IST)</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">UTC+05:30</span>
          </div>
        </div>
      </div>

      {/* Visual Theme */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Appearance Theme</h2>
          <p className="text-xs text-slate-500">Switch between sleek Dark Mode and modern Light Mode</p>
        </div>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 mr-2 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 mr-2 text-slate-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Data Portability & Security */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Data Portability</h2>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          SmartSpend AI strictly complies with the Indian <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>. 
          We never store UPI PINs, ATM PINs, OTPs, or NetBanking passwords. All financial records are isolated to your unique tenant account.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span>Download All Records (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
