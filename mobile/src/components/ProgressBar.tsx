import React from 'react';
import { View, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  height?: number;
  trackColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  color = THEME.colors.primary,
  height = 6,
  trackColor = THEME.colors.cardElevated,
}) => {
  const clamped = Math.max(0, Math.min(100, isNaN(percentage) ? 0 : percentage));

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
