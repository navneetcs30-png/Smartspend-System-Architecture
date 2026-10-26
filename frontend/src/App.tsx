import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { GoalsPage } from './pages/GoalsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ImporterPage } from './pages/ImporterPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddTxnOpen, setIsAddTxnOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading SmartSpend AI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleTxnSuccess = () => {
    // Increment refreshKey to trigger child component re-renders if necessary
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <Navbar 
        onOpenAddTxn={() => setIsAddTxnOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              onOpenAddTxn={() => setIsAddTxnOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPage
              key={refreshKey}
              onOpenAddTxn={() => setIsAddTxnOpen(true)}
            />
          )}

          {activeTab === 'reports' && <ReportsPage key={refreshKey} />}
          {activeTab === 'budgets' && <BudgetsPage key={refreshKey} />}
          {activeTab === 'goals' && <GoalsPage key={refreshKey} />}
          {activeTab === 'subscriptions' && <SubscriptionsPage key={refreshKey} />}
          {activeTab === 'ai-analyst' && <AIAssistantPage key={refreshKey} />}
          {activeTab === 'importer' && <ImporterPage key={refreshKey} />}
          {activeTab === 'settings' && <SettingsPage key={refreshKey} />}
        </main>
      </div>

      <AddTransactionModal
        isOpen={isAddTxnOpen}
        onClose={() => setIsAddTxnOpen(false)}
        onSuccess={handleTxnSuccess}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
