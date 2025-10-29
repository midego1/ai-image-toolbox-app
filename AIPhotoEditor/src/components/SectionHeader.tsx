import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface SectionHeaderProps {
  title: string;
  style?: any;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, style }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={[styles.container, { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm }, style]}>
      <Text style={[styles.title, { color: colors.textTertiary, fontSize: typography.scaled.xs, fontWeight: typography.weight.semibold, letterSpacing: 0.5 }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Dynamic styles applied inline
  },
  title: {
    // Dynamic styles applied inline
  },
});

