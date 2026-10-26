import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../constants/theme';
import { getApiUrl, setCustomApiUrl } from '../services/api';
import {
  Wallet,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  AlertCircle,
  Server,
  X,
  Check,
  Globe,
} from 'lucide-react-native';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server Host Config State
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [inputApiUrl, setInputApiUrl] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getApiUrl().then((url) => {
      setCurrentApiUrl(url);
      setInputApiUrl(url);
    });
  }, []);

  const handleSaveApiUrl = async (urlToSave?: string) => {
    const target = (urlToSave || inputApiUrl).trim();
    if (!target) return;
    await setCustomApiUrl(target);
    const updated = await getApiUrl();
    setCurrentApiUrl(updated);
    setInputApiUrl(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setServerModalVisible(false);
    }, 800);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        if (!fullName.trim()) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        await register(email.trim(), password, fullName.trim(), phone.trim() || undefined);
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials or server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login('demo@smartspend.ai', 'Password123!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Demo login failed. Please check backend server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.iconCircle}>
            <Wallet size={32} color="#070A11" />
          </View>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>SmartSpend</Text>
            <View style={styles.aiBadge}>
              <Sparkles size={10} color={THEME.colors.primary} />
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>
            Personal Finance Assistant for India (₹ INR, UPI & Analytics)
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Instant Demo Login Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color={THEME.colors.primary} />
            <Text style={styles.demoButtonText}>Click for Instant Demo Login</Text>
          </TouchableOpacity>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, !isRegister && styles.tabButtonActive]}
              onPress={() => {
                setIsRegister(false);
                setError(null);
              }}
            >
              <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, isRegister && styles.tabButtonActive]}
              onPress={() => {
                setIsRegister(true);
                setError(null);
              }}
            >
              <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={THEME.colors.expense} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form Fields */}
          {isRegister && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                <UserIcon size={16} color={THEME.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Aarav Sharma"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.label}>Mobile Number (Optional)</Text>
              <View style={styles.inputContainer}>
                <Phone size={16} color={THEME.colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail size={16} color={THEME.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              placeholderTextColor={THEME.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Lock size={16} color={THEME.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={THEME.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#070A11" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRegister ? 'Create Free Account' : 'Sign In to SmartSpend'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security disclaimer */}
        <Text style={styles.securityNote}>
          🔒 Zero UPI PIN / Bank credential storage • DPDP Act 2023 compliant
        </Text>

        {/* Server Connection Config Chip */}
        <TouchableOpacity
          style={styles.serverChip}
          onPress={() => setServerModalVisible(true)}
          activeOpacity={0.7}
        >
          <Server size={12} color={THEME.colors.textMuted} />
          <Text style={styles.serverChipText} numberOfLines={1}>
            API Host: {currentApiUrl || 'Default'} (Tap to configure)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server URL Configuration Modal */}
      <Modal visible={serverModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Globe size={18} color={THEME.colors.primary} />
                <Text style={styles.modalTitle}>Backend Server Connection</Text>
              </View>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <X size={20} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Select or enter the FastAPI backend server URL for your device environment:
            </Text>

            {/* Quick Presets */}
            <View style={styles.presetsContainer}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleSaveApiUrl('http://10.0.2.2:8000/api/v1')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetTitle}>Android Emulator</Text>
                <Text style={styles.presetUrl}>http://10.0.2.2:8000/api/v1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleSaveApiUrl('http://192.168.1.16:8000/api/v1')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetTitle}>Physical Phone (Wi-Fi LAN)</Text>
                <Text style={styles.presetUrl}>http://192.168.1.16:8000/api/v1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => handleSaveApiUrl('http://127.0.0.1:8000/api/v1')}
                activeOpacity={0.8}
              >
                <Text style={styles.presetTitle}>Localhost (Web / iOS)</Text>
                <Text style={styles.presetUrl}>http://127.0.0.1:8000/api/v1</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Input */}
            <Text style={styles.customLabel}>Custom Server URL</Text>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                placeholder="http://192.168.1.16:8000/api/v1"
                placeholderTextColor={THEME.colors.textMuted}
                value={inputApiUrl}
                onChangeText={setInputApiUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.saveUrlButton}
                onPress={() => handleSaveApiUrl()}
                activeOpacity={0.8}
              >
                {savedSuccess ? (
                  <Check size={16} color="#070A11" />
                ) : (
                  <Text style={styles.saveUrlButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bg,
  },
  scrollContent: {
    padding: THEME.spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: THEME.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  brandSubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.colors.primaryGlow,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryLight,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.cardElevated,
    borderRadius: THEME.borderRadius.md,
    padding: 3,
    marginBottom: THEME.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: THEME.spacing.sm,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.primaryDark,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textMuted,
  },
  tabTextActive: {
    color: THEME.colors.textPrimary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.expenseBg,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: '#FCA5A5',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
    marginTop: THEME.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    color: THEME.colors.textPrimary,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#070A11',
  },
  securityNote: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: THEME.spacing.xl,
  },
  serverChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: THEME.spacing.md,
    alignSelf: 'center',
  },
  serverChipText: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 17, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
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
    marginBottom: THEME.spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalDescription: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
    lineHeight: 16,
  },
  presetsContainer: {
    gap: 8,
    marginBottom: THEME.spacing.md,
  },
  presetButton: {
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.primaryLight,
  },
  presetUrl: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
  customLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customInput: {
    flex: 1,
    height: 40,
    backgroundColor: THEME.colors.cardElevated,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    fontSize: 11,
    color: THEME.colors.textPrimary,
  },
  saveUrlButton: {
    height: 40,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveUrlButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#070A11',
  },
});
