import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface CompactStatsBarProps {
  /** Time it takes (e.g., "2-5s" or "2.5s") */
  time: string;
  /** Credits cost (e.g., "1" or "0.1") */
  credits: string;
  /** Rating (e.g., "4.9" or "4.8") */
  rating: string;
  /** Usage count (e.g., "2.3k" or "1.2k") */
  usage: string;
  /** Optional container style override */
  containerStyle?: any;
}

/**
 * Compact stats bar component for processing screen.
 * Displays time, credits, rating, and usage metrics in a horizontal compact bar.
 */
export const CompactStatsBar: React.FC<CompactStatsBarProps> = ({
  time,
  credits,
  rating,
  usage,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const stats = [
    { icon: 'flash' as const, label: time },
    { icon: 'diamond' as const, label: credits },
    { icon: 'star' as const, label: rating },
    { icon: 'flame' as const, label: usage },
  ];

  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface + 'CC', // ~80% opacity
      borderColor: colors.border,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    }, containerStyle]}>
      {stats.map((stat, index) => (
        <React.Fragment key={stat.icon}>
          <View style={styles.statItem}>
            <Ionicons 
              name={stat.icon} 
              size={14} 
              color={colors.primary} 
            />
            <Text style={[styles.statLabel, {
              color: colors.text,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
            }]}>
              {stat.label}
            </Text>
          </View>
          {index < stats.length - 1 && (
            <View style={[styles.separator, {
              backgroundColor: colors.border,
            }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  statLabel: {
    // Dynamic styling applied inline
  },
  separator: {
    width: 1,
    height: 16,
    opacity: 0.3,
  },
});


