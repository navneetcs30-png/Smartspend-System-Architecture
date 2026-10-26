import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { THEME } from './constants/theme';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { BudgetsScreen } from './screens/BudgetsScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { SubscriptionsScreen } from './screens/SubscriptionsScreen';
import { AIAssistantScreen } from './screens/AIAssistantScreen';
import { AddTransactionModal } from './components/AddTransactionModal';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Repeat,
  Sparkles,
  LogOut,
  Wallet,
} from 'lucide-react-native';

const MainNavigator: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [addTxnModalVisible, setAddTxnModalVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Initializing SmartSpend AI...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleTxnRecorded = () => {
    setRefreshKey((k) => k + 1);
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'subscriptions', label: 'Bills', icon: Repeat },
    { id: 'ai-analyst', label: 'AI Analyst', icon: Sparkles, isAi: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={THEME.colors.bg} />

      {/* Top Mobile Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Wallet size={18} color="#070A11" />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>SmartSpend</Text>
              <View style={styles.aiTag}>
                <Text style={styles.aiTagText}>AI</Text>
              </View>
            </View>
            <Text style={styles.userEmailText}>{user.full_name || user.email}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutButton} activeOpacity={0.7}>
          <LogOut size={18} color={THEME.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Screen Views */}
      <View style={styles.contentArea}>
        {activeTab === 'dashboard' && (
          <DashboardScreen
            key={refreshKey}
            onOpenAddTxn={() => setAddTxnModalVisible(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsScreen
            key={refreshKey}
            onOpenAddTxn={() => setAddTxnModalVisible(true)}
          />
        )}
        {activeTab === 'budgets' && <BudgetsScreen key={refreshKey} />}
        {activeTab === 'goals' && <GoalsScreen key={refreshKey} />}
        {activeTab === 'subscriptions' && <SubscriptionsScreen key={refreshKey} />}
        {activeTab === 'ai-analyst' && <AIAssistantScreen key={refreshKey} />}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.bottomTabBar}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(item.id)}
              activeOpacity={0.7}
            >
              <Icon
                size={18}
                color={
                  isActive
                    ? item.isAi
                      ? THEME.colors.indigo
                      : THEME.colors.primary
                    : THEME.colors.textMuted
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && (item.isAi ? styles.tabLabelAiActive : styles.tabLabelActive),
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global Add Transaction Modal */}
      <AddTransactionModal
        visible={addTxnModalVisible}
        onClose={() => setAddTxnModalVisible(false)}
        onSuccess={handleTxnRecorded}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    paddingTop: Platform.OS === 'android' ? 28 : 0,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: THEME.spacing.md,
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  aiTag: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  userEmailText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  logoutButton: {
    padding: 8,
  },
  contentArea: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 3,
  },
  tabLabelActive: {
    color: THEME.colors.primaryLight,
    fontWeight: '700',
  },
  tabLabelAiActive: {
    color: THEME.colors.indigo,
    fontWeight: '700',
  },
});
