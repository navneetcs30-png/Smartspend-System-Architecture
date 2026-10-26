import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'success',
  icon,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: THEME.colors.warningBg,
          text: THEME.colors.warning,
          border: 'rgba(245, 158, 11, 0.4)',
        };
      case 'danger':
        return {
          bg: THEME.colors.expenseBg,
          text: THEME.colors.expense,
          border: 'rgba(239, 68, 68, 0.4)',
        };
      case 'info':
        return {
          bg: THEME.colors.indigoBg,
          text: THEME.colors.indigo,
          border: 'rgba(99, 102, 241, 0.4)',
        };
      case 'purple':
        return {
          bg: THEME.colors.purpleBg,
          text: THEME.colors.purple,
          border: 'rgba(168, 85, 247, 0.4)',
        };
      case 'success':
      default:
        return {
          bg: THEME.colors.primaryGlow,
          text: THEME.colors.primary,
          border: 'rgba(16, 185, 129, 0.4)',
        };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
