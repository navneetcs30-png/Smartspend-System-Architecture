import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Plus, 
  LogOut, 
  User as UserIcon,
  Wallet
} from 'lucide-react';

interface NavbarProps {
  onOpenAddTxn: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddTxn, activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 glass border-b border-slate-200/80 dark:border-white/[0.07] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">SmartSpend</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  <Sparkles className="w-2.5 h-2.5 mr-0.5 text-emerald-500 dark:text-emerald-400" /> AI
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">Indian Personal Finance Assistant</span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Global Add Transaction Button */}
            <button
              id="global-add-txn-btn"
              onClick={onOpenAddTxn}
              className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 shadow-md shadow-emerald-500/20 transition-all duration-150"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-1.5 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>

            {/* AI Assistant Quick Toggle */}
            <button
              onClick={() => setActiveTab('ai-analyst')}
              className={`p-2 rounded-xl border text-sm font-medium transition-colors ${
                activeTab === 'ai-analyst'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
              title="Open AI Analyst"
            >
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile Pill & Logout */}
            <div className="flex items-center pl-2 border-l border-slate-200 dark:border-white/[0.08] space-x-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.full_name || 'User'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
