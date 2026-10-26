import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';
import { Transaction } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { Search, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Filter, Plus } from 'lucide-react-native';

interface TransactionsScreenProps {
  onOpenAddTxn: () => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onOpenAddTxn }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [filterType]);

  const loadTransactions = async () => {
    try {
      let url = '/transactions?limit=50';
      if (filterType !== 'ALL') {
        url += `&transaction_type=${filterType}`;
      }
      const res = await api.get(url);
      setTransactions(res.data.items);
    } catch (err) {
      console.log('Error loading transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const filteredTxns = transactions.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      (t.merchant_name && t.merchant_name.toLowerCase().includes(q)) ||
      (t.category?.name && t.category.name.toLowerCase().includes(q))
    );
  });

  return (
    <View style={styles.container}>
      {/* Search & Header */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Search size={16} color={THEME.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search description, merchant, category..."
            placeholderTextColor={THEME.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={onOpenAddTxn} activeOpacity={0.8}>
          <Plus size={18} color="#070A11" />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterType === f && styles.filterChipActive]}
            onPress={() => setFilterType(f)}
          >
            <Text style={[styles.filterChipText, filterType === f && styles.filterChipTextActive]}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTxns}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.colors.primary} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No matching ledger records found.</Text>
          }
          renderItem={({ item }) => {
            const isExpense = item.transaction_type === 'EXPENSE';
            const isIncome = item.transaction_type === 'INCOME';
            return (
              <View style={styles.txnCard}>
                <View style={styles.txnLeft}>
                  <View
                    style={[
                      styles.iconCircle,
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
                  <View style={styles.txnDetails}>
                    <Text style={styles.description} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{formatDate(item.transaction_date)}</Text>
                      {item.category?.name && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{item.category.name}</Text>
                        </View>
                      )}
                      <Text style={styles.metaText}>{item.payment_method}</Text>
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
                  {isIncome ? '+' : '-'}{formatINR(item.amount_inr)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 12,
    color: THEME.colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  filterChipTextActive: {
    color: THEME.colors.primaryLight,
  },
  listContent: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnDetails: {
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
    marginTop: 3,
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
