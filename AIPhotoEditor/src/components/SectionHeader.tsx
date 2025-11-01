import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface SectionHeaderProps {
  title: string;
  style?: any;
  rightAction?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, style, rightAction }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm }, style]}>
      <Text style={[styles.title, { color: colors.textTertiary, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold, letterSpacing: 0.5 }]}>
        {title.toUpperCase()}
      </Text>
      {rightAction && (
        <View style={styles.rightAction}>
          {rightAction}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  title: {
    // Dynamic styles applied inline
  },
  rightAction: {
    marginLeft: 8,
  },
});

