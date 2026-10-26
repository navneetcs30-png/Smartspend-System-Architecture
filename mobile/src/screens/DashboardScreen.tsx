import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardSummary, Transaction, CategorySpendItem } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';
import { KPICard, TransactionItem, ProgressBar } from '../components';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  PieChart as PieIcon,
  Target,
  Flame,
  Calendar,
  Sparkles,
  Plus,
  ShieldCheck,
} from 'lucide-react-native';

interface DashboardScreenProps {
  onOpenAddTxn: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenAddTxn,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashRes, txnsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/transactions?limit=5'),
      ]);
      setData(dashRes.data);
      setRecentTxns(txnsRes.data.items);
    } catch (err) {
      console.log('Error loading mobile dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading && !data) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading SmartSpend AI...</Text>
      </View>
    );
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#64748B'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
    >
      {/* Top Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerHeader}>
          <ShieldCheck size={14} color={THEME.colors.primary} />
          <Text style={styles.bannerBadge}>Verified Financial Ledger</Text>
        </View>
        <Text style={styles.greetingText}>Welcome back, {user?.full_name?.split(' ')[0] || 'User'}</Text>
        <Text style={styles.periodText}>{data?.period_label || 'Current Month'} Overview</Text>

        <View style={styles.bannerActions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={onOpenAddTxn}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#070A11" />
            <Text style={styles.primaryActionText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => onNavigateTab('ai-analyst')}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color={THEME.colors.primaryLight} />
            <Text style={styles.secondaryActionText}>Ask AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 8 Primary Financial KPI Cards using modular KPICard component */}
      <Text style={styles.sectionHeader}>Key Financial Metrics</Text>
      <View style={styles.kpiGrid}>
        <KPICard
          label="Total Income"
          value={formatINR(data?.total_income_inr)}
          subtext="Deposits"
          subtextColor={THEME.colors.income}
          icon={<TrendingUp size={14} color={THEME.colors.income} />}
          iconBgColor={THEME.colors.incomeBg}
        />
        <KPICard
          label="Total Expenses"
          value={formatINR(data?.total_expenses_inr)}
          subtext="Total Outflows"
          subtextColor={THEME.colors.expense}
          icon={<TrendingDown size={14} color={THEME.colors.expense} />}
          iconBgColor={THEME.colors.expenseBg}
        />
        <KPICard
          label="Net Savings"
          value={formatINR(data?.net_savings_inr)}
          subtext="Retained Capital"
          subtextColor={THEME.colors.primary}
          icon={<PiggyBank size={14} color={THEME.colors.primary} />}
          iconBgColor={THEME.colors.primaryGlow}
        />
        <KPICard
          label="Savings Rate"
          value={formatPercent(data?.savings_rate_percent)}
          subtext="Of Total Income"
          icon={<Percent size={14} color={THEME.colors.indigo} />}
          iconBgColor={THEME.colors.indigoBg}
        />
        <KPICard
          label="Budgets"
          value={String(data?.active_budgets_count || 0)}
          subtext="Active Limits"
          icon={<PieIcon size={14} color={THEME.colors.warning} />}
          iconBgColor={THEME.colors.warningBg}
        />
        <KPICard
          label="Savings Goals"
          value={String(data?.active_goals_count || 0)}
          subtext="Targets Active"
          icon={<Target size={14} color={THEME.colors.purple} />}
          iconBgColor={THEME.colors.purpleBg}
        />
        <KPICard
          label="Daily Burn"
          value={formatINR(data?.avg_daily_spending_inr)}
          subtext="Avg Daily Spend"
          icon={<Flame size={14} color="#F97316" />}
          iconBgColor="rgba(249, 115, 22, 0.12)"
        />
        <KPICard
          label="Projected EOM"
          value={formatINR(data?.projected_month_end_inr)}
          subtext="Estimated Total"
          icon={<Calendar size={14} color={THEME.colors.indigo} />}
          iconBgColor={THEME.colors.indigoBg}
        />
      </View>

      {/* Top Categories Spending */}
      {data?.category_breakdown && data.category_breakdown.length > 0 && (
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Top Spending Categories</Text>
            <TouchableOpacity onPress={() => onNavigateTab('budgets')}>
              <Text style={styles.cardActionText}>View Limits</Text>
            </TouchableOpacity>
          </View>

          {data.category_breakdown.slice(0, 4).map((c: CategorySpendItem, i: number) => (
            <View key={i} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{c.category_name}</Text>
                <Text style={styles.categoryAmount}>
                  {formatINR(c.total_inr)} ({c.percentage}%)
                </Text>
              </View>
              <ProgressBar
                percentage={c.percentage}
                color={COLORS[i % COLORS.length]}
                height={6}
              />
            </View>
          ))}
        </View>
      )}

      {/* Recent Transactions using modular TransactionItem component */}
      <View style={styles.cardContainer}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Recent Ledger Transactions</Text>
          <TouchableOpacity onPress={() => onNavigateTab('transactions')}>
            <Text style={styles.cardActionText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTxns.length === 0 ? (
          <Text style={styles.emptyText}>No transactions recorded yet.</Text>
        ) : (
          recentTxns.map((txn) => (
            <TransactionItem
              key={txn.id}
              transaction={txn}
              onPress={() => onNavigateTab('transactions')}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 80,
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
  banner: {
    backgroundColor: '#0A1627',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  periodText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    marginBottom: THEME.spacing.md,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#070A11',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: THEME.spacing.sm,
    marginLeft: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: THEME.spacing.lg,
  },
  cardContainer: {
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: THEME.spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.primaryLight,
  },
  categoryItem: {
    marginBottom: THEME.spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    paddingVertical: THEME.spacing.lg,
  },
});
