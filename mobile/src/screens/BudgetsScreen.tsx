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
import { api } from '../services/api';
import { BudgetProgress } from '../types';
import { formatINR } from '../utils/formatters';
import { PieChart, AlertTriangle, CheckCircle2, TrendingUp, AlertOctagon } from 'lucide-react-native';

export const BudgetsScreen: React.FC = () => {
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      const res = await api.get('/budgets/progress');
      setBudgets(res.data);
    } catch (err) {
      console.log('Error loading budgets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBudgets();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Category Budgets</Text>
        <Text style={styles.headerSubtitle}>
          Real-time threshold monitoring & End-of-Month run-rate projections
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.colors.primary} />
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <PieChart size={40} color={THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Budgets Configured</Text>
          <Text style={styles.emptySubtitle}>
            Create your first budget limit to receive proactive overspending warnings.
          </Text>
        </View>
      ) : (
        budgets.map((b) => {
          const isExceeded = b.status === 'EXCEEDED';
          const isWarning = b.status === 'WARNING';
          const statusColor = isExceeded
            ? THEME.colors.expense
            : isWarning
            ? THEME.colors.warning
            : THEME.colors.primary;

          return (
            <View key={b.id} style={styles.budgetCard}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.categoryName}>{b.category_name}</Text>
                  <Text style={styles.limitText}>Limit: {formatINR(b.budget_limit_inr)} / month</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isExceeded
                        ? THEME.colors.expenseBg
                        : isWarning
                        ? THEME.colors.warningBg
                        : THEME.colors.primaryGlow,
                      borderColor: statusColor,
                    },
                  ]}
                >
                  {isExceeded ? (
                    <AlertOctagon size={12} color={THEME.colors.expense} />
                  ) : isWarning ? (
                    <AlertTriangle size={12} color={THEME.colors.warning} />
                  ) : (
                    <CheckCircle2 size={12} color={THEME.colors.primary} />
                  )}
                  <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                    {b.status}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, b.percentage_used)}%`,
                        backgroundColor: statusColor,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.spentText}>
                    Spent: <Text style={{ color: THEME.colors.textPrimary, fontWeight: '700' }}>{formatINR(b.spent_inr)}</Text>
                  </Text>
                  <Text style={[styles.percentageText, { color: statusColor }]}>
                    {b.percentage_used.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Run-Rate Projection Footer */}
              <View style={styles.projectionFooter}>
                <View style={styles.projectionLeft}>
                  <TrendingUp size={12} color={THEME.colors.textSecondary} />
                  <Text style={styles.projectionText}>
                    Run-Rate EOM: {formatINR(b.projected_eom_inr)}
                  </Text>
                </View>
                <Text style={styles.remainingText}>
                  {b.remaining_inr >= 0
                    ? `Remaining: ${formatINR(b.remaining_inr)}`
                    : `Overspent: ${formatINR(Math.abs(b.remaining_inr))}`}
                </Text>
              </View>
            </View>
          );
        })
      )}
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
  header: {
    marginBottom: THEME.spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginTop: THEME.spacing.md,
  },
  emptySubtitle: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  budgetCard: {
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: THEME.spacing.md,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  limitText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressContainer: {
    marginBottom: THEME.spacing.sm,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: THEME.colors.cardElevated,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '800',
  },
  projectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  projectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  projectionText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
  },
});
