import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { THEME } from '../constants/theme';
import { Transaction } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react-native';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  showCategoryBadge?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
  showCategoryBadge = false,
}) => {
  const isIncome = transaction.transaction_type === 'INCOME';
  const isExpense = transaction.transaction_type === 'EXPENSE';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isIncome
                ? THEME.colors.incomeBg
                : isExpense
                ? THEME.colors.expenseBg
                : THEME.colors.transferBg,
            },
          ]}
        >
          {isIncome ? (
            <ArrowDownLeft size={16} color={THEME.colors.income} />
          ) : isExpense ? (
            <ArrowUpRight size={16} color={THEME.colors.expense} />
          ) : (
            <ArrowLeftRight size={16} color={THEME.colors.transfer} />
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {formatDate(transaction.transaction_date)} • {transaction.payment_method}
            </Text>
            {showCategoryBadge && transaction.category?.name && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{transaction.category.name}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <Text
        style={[
          styles.amount,
          {
            color: isIncome
              ? THEME.colors.income
              : isExpense
              ? THEME.colors.textPrimary
              : THEME.colors.transfer,
          },
        ]}
      >
        {isIncome ? '+' : '-'}{formatINR(transaction.amount_inr)}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
});
