import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export interface ToolStatsBarProps {
  /** Time it takes (e.g., "2-5 sec" or "2.5 sec") */
  time: string;
  /** Cost (e.g., "0.1 cost" or "1 cost") */
  cost: string;
  /** Rating (e.g., "4.9/5" or "4.8/5") */
  rating: string;
  /** Usage count (e.g., "2.3k today" or "1.2k uses") */
  usage: string;
  /** Optional container style override */
  containerStyle?: any;
}

/**
 * Reusable stats bar component for AI tool detail screens.
 * Displays time, credits, rating, and usage metrics in a horizontal bar.
 */
export const ToolStatsBar: React.FC<ToolStatsBarProps> = ({
  time,
  cost,
  rating,
  usage,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={[styles.statsBar, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    }, containerStyle]}>
      <View style={styles.statItem}>
        <Ionicons name="flash" size={16} color={colors.primary} />
        <Text style={[styles.statLabel, {
          color: colors.textSecondary,
          fontSize: typography.scaled.xs,
        }]}>
          {time}
        </Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="diamond" size={16} color={colors.primary} />
        <Text style={[styles.statLabel, {
          color: colors.textSecondary,
          fontSize: typography.scaled.xs,
        }]}>
          {cost}
        </Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="star" size={16} color={colors.primary} />
        <Text style={[styles.statLabel, {
          color: colors.textSecondary,
          fontSize: typography.scaled.xs,
        }]}>
          {rating}
        </Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="flame" size={16} color={colors.primary} />
        <Text style={[styles.statLabel, {
          color: colors.textSecondary,
          fontSize: typography.scaled.xs,
        }]}>
          {usage}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  statLabel: {
    // Dynamic styling applied in component
  },
});

