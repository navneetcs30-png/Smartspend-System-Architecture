import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';
import { SavingsGoal } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { Target, Calendar, Plus, CheckCircle, X } from 'lucide-react-native';

export const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Contribution Modal State
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [contributing, setContributing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data);
    } catch (err) {
      console.log('Error loading goals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGoals();
  };

  const handleContribute = async () => {
    if (!selectedGoal) return;
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;

    setContributing(true);
    try {
      await api.post(`/goals/${selectedGoal.id}/contributions`, {
        amount_inr: val,
        notes: 'Mobile app deposit',
      });
      setModalVisible(false);
      setDepositAmount('');
      loadGoals();
    } catch (err) {
      console.log('Failed contribution:', err);
    } finally {
      setContributing(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savings Targets & Milestones</Text>
        <Text style={styles.headerSubtitle}>
          Visual progress tracking & automated required monthly savings math
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.colors.primary} />
        </View>
      ) : goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Target size={40} color={THEME.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Savings Goals Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your emergency fund or vacation goal to track disciplined monthly savings.
          </Text>
        </View>
      ) : (
        goals.map((goal) => {
          const isCompleted = goal.percentage_achieved >= 100;
          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  {goal.target_date && (
                    <View style={styles.dateRow}>
                      <Calendar size={11} color={THEME.colors.textMuted} />
                      <Text style={styles.dateText}>Target: {formatDate(goal.target_date)}</Text>
                    </View>
                  )}
                </View>

                {isCompleted ? (
                  <View style={styles.completedBadge}>
                    <CheckCircle size={12} color={THEME.colors.primary} />
                    <Text style={styles.completedBadgeText}>Completed</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.depositButton}
                    onPress={() => {
                      setSelectedGoal(goal);
                      setModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={12} color="#070A11" />
                    <Text style={styles.depositButtonText}>Contribute</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(100, goal.percentage_achieved)}%`,
                        backgroundColor: THEME.colors.purple,
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.savedText}>
                    Saved: <Text style={{ color: THEME.colors.textPrimary, fontWeight: '700' }}>{formatINR(goal.current_saved_inr)}</Text> of {formatINR(goal.target_amount_inr)}
                  </Text>
                  <Text style={styles.percentageText}>{goal.percentage_achieved.toFixed(1)}%</Text>
                </View>
              </View>

              {/* Footer: Required Monthly Savings */}
              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Required Monthly:</Text>
                <Text style={styles.footerValue}>
                  {goal.monthly_savings_needed_inr > 0
                    ? `${formatINR(goal.monthly_savings_needed_inr)} / month`
                    : 'Target Achieved! 🎉'}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {/* Contribute Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deposit to {selectedGoal?.name}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Deposit Amount (₹ INR)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="5000"
                placeholderTextColor={THEME.colors.textMuted}
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleContribute}
              disabled={contributing}
              activeOpacity={0.8}
            >
              {contributing ? (
                <ActivityIndicator color="#070A11" />
              ) : (
                <Text style={styles.modalConfirmText}>Confirm Deposit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  goalCard: {
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
  goalName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  depositButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
  },
  depositButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#070A11',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    borderColor: THEME.colors.primary,
    borderWidth: 1,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primaryLight,
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
  savedText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.purple,
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
  footerLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  footerValue: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primaryLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 17, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: 44,
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalConfirmButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#070A11',
  },
});
