import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';
import { RecurringExpense } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { Repeat, Calendar, ShieldAlert } from 'lucide-react-native';

export const SubscriptionsScreen: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const res = await api.get('/recurring');
      setSubscriptions(res.data);
    } catch (err) {
      console.log('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubscriptions();
  };

  const totalMonthlyINR = subscriptions.reduce((acc, s) => {
    if (s.billing_cycle === 'MONTHLY') return acc + s.amount_inr;
    if (s.billing_cycle === 'YEARLY') return acc + (s.amount_inr / 12);
    if (s.billing_cycle === 'WEEKLY') return acc + (s.amount_inr * 4.33);
    return acc + s.amount_inr;
  }, 0);

  const totalAnnualINR = totalMonthlyINR * 12;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recurring Subscriptions</Text>
        <Text style={styles.headerSubtitle}>
          Annualized commitment tracking & renewal calendar
        </Text>
      </View>

      {/* Annualized Cost Impact Banner */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <ShieldAlert size={14} color={THEME.colors.warning} />
          <Text style={styles.summaryBadge}>True Cost Visibility</Text>
        </View>
        <Text style={styles.annualTotalText}>{formatINR(totalAnnualINR)} / year</Text>
        <Text style={styles.annualSubText}>
          Total annualized impact across {subscriptions.length} active subscriptions ({formatINR(totalMonthlyINR)} / month).
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.colors.primary} />
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Repeat size={40} color={THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Subscriptions Tracked</Text>
          <Text style={styles.emptySubtitle}>
            Add recurring bills to keep track of renewals and identify unused services.
          </Text>
        </View>
      ) : (
        subscriptions.map((sub) => (
          <View key={sub.id} style={styles.subCard}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.categoryText}>{sub.category_name} • {sub.payment_method}</Text>
              </View>

              <View style={styles.amountBox}>
                <Text style={styles.amountText}>{formatINR(sub.amount_inr)}</Text>
                <Text style={styles.cycleText}>/{sub.billing_cycle.toLowerCase()}</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <View style={styles.renewalRow}>
                <Calendar size={11} color={THEME.colors.textMuted} />
                <Text style={styles.renewalText}>
                  {sub.next_renewal_date ? `Due ${formatDate(sub.next_renewal_date)}` : 'Monthly Cycle'}
                </Text>
              </View>

              <Text style={styles.annualizedText}>
                Annual Impact: <Text style={{ color: THEME.colors.textPrimary, fontWeight: '700' }}>{formatINR(sub.annual_cost_inr)}</Text>
              </Text>
            </View>
          </View>
        ))
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
  summaryCard: {
    backgroundColor: '#0F1A26',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.warning,
    textTransform: 'uppercase',
  },
  annualTotalText: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  annualSubText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
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
  subCard: {
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
    marginBottom: THEME.spacing.sm,
  },
  subName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  categoryText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  cycleText: {
    fontSize: 9,
    color: THEME.colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  renewalText: {
    fontSize: 10,
    color: THEME.colors.textSecondary,
  },
  annualizedText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
});
