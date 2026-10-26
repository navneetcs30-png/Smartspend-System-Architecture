import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

interface KPICardProps {
  label: string;
  value: string;
  subtext?: string;
  subtextColor?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  width?: any;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  subtextColor,
  icon,
  iconBgColor = THEME.colors.primaryGlow,
  width = '48.5%',
}) => {
  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      {subtext && (
        <Text style={[styles.subtext, subtextColor ? { color: subtextColor } : null]} numberOfLines={1}>
          {subtext}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtext: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    marginTop: 2,
  },
});
