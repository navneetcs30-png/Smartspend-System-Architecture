import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { api } from '../services/api';
import { Category, Account } from '../types';
import { X, AlertCircle } from 'lucide-react-native';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [txnType, setTxnType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NETBANKING' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'CASH'>('UPI');
  const [paymentSource, setPaymentSource] = useState('PhonePe / Paytm');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [referenceUtr, setReferenceUtr] = useState('');
  const [notes, setNotes] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadDependencies();
    }
  }, [visible]);

  const loadDependencies = async () => {
    try {
      const [catsRes, accsRes] = await Promise.all([
        api.get('/transactions/categories'),
        api.get('/accounts'),
      ]);
      setCategories(catsRes.data);
      setAccounts(accsRes.data);
      if (catsRes.data.length > 0 && !categoryId) {
        setCategoryId(catsRes.data[0].id);
      }
      if (accsRes.data.length > 0 && !accountId) {
        setAccountId(accsRes.data[0].id);
      }
      if (accsRes.data.length > 1 && !destinationAccountId) {
        setDestinationAccountId(accsRes.data[1].id);
      }
    } catch {
      // silent
    }
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount in INR (₹).');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a transaction description.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post('/transactions', {
        amount_inr: parsedAmount,
        transaction_type: txnType,
        transaction_date: new Date().toISOString(),
        description: description.trim(),
        merchant_name: merchant.trim() || undefined,
        category_id: categoryId || undefined,
        account_id: accountId || undefined,
        destination_account_id: txnType === 'TRANSFER' ? destinationAccountId : undefined,
        payment_method: paymentMethod,
        payment_source: paymentSource,
        reference_utr: referenceUtr.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Reset
      setAmount('');
      setDescription('');
      setMerchant('');
      setReferenceUtr('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Record Transaction</Text>
              <Text style={styles.headerSubtitle}>Exact Paise Precision • UPI & Bank</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={THEME.colors.expense} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollBody} keyboardShouldPersistTaps="handled">
            {/* Transaction Type Segment */}
            <View style={styles.typeSegment}>
              {(['EXPENSE', 'INCOME', 'TRANSFER'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, txnType === type && styles.typeButtonActive]}
                  onPress={() => setTxnType(type)}
                >
                  <Text style={[styles.typeButtonText, txnType === type && styles.typeButtonTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount Input */}
            <Text style={styles.label}>Amount (₹ INR)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={THEME.colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Swiggy Lunch, Zepto Grocery, Salary"
              placeholderTextColor={THEME.colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            {/* Merchant / Vendor */}
            <Text style={styles.label}>Merchant / Payee (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Swiggy, Amazon, Shell Petrol"
              placeholderTextColor={THEME.colors.textMuted}
              value={merchant}
              onChangeText={setMerchant}
            />

            {/* Category Selector */}
            {txnType !== 'TRANSFER' && (
              <>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, categoryId === c.id && styles.chipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Payment Method */}
            <Text style={styles.label}>Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {(['UPI', 'NETBANKING', 'DEBIT_CARD', 'CREDIT_CARD', 'CASH'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.chip, paymentMethod === method && styles.chipActive]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text style={[styles.chipText, paymentMethod === method && styles.chipTextActive]}>
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Reference / UTR */}
            <Text style={styles.label}>UPI UTR / Reference No. (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="12-digit UTR for automatic deduplication"
              placeholderTextColor={THEME.colors.textMuted}
              value={referenceUtr}
              onChangeText={setReferenceUtr}
            />

            {/* Notes */}
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
              placeholder="Additional transaction context..."
              placeholderTextColor={THEME.colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </ScrollView>

          {/* Submit Action */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#070A11" />
            ) : (
              <Text style={styles.saveButtonText}>Save to Ledger</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 17, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.colors.card,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    borderColor: THEME.colors.border,
    borderTopWidth: 1,
    padding: THEME.spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingBottom: THEME.spacing.sm,
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
  closeButton: {
    padding: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.expenseBg,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  errorText: {
    fontSize: 11,
    color: '#FCA5A5',
    flex: 1,
  },
  scrollBody: {
    marginBottom: THEME.spacing.md,
  },
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cardElevated,
    borderRadius: THEME.borderRadius.md,
    padding: 3,
    marginBottom: THEME.spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  typeButtonActive: {
    backgroundColor: THEME.colors.primaryDark,
  },
  typeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  typeButtonTextActive: {
    color: THEME.colors.textPrimary,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
    marginTop: THEME.spacing.sm,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
  },
  rupeePrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.primary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: 48,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  input: {
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    height: 44,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: THEME.spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: THEME.colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: THEME.colors.primaryLight,
  },
  saveButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#070A11',
  },
});
