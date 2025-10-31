import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';
import { OptionSelector, OptionSelectorProps } from './OptionSelector';

export interface OptionGroupProps {
  children?: React.ReactNode;
  selectors?: OptionSelectorProps[];
  containerStyle?: any;
}

export const OptionGroup: React.FC<OptionGroupProps> = ({
  children,
  selectors = [],
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }, containerStyle]}>
      {selectors.map((selector, index) => (
        <View key={selector.label}>
          <OptionSelector
            {...selector}
          />
          {index < selectors.length - 1 && (
            <View style={{ height: spacing.base }} />
          )}
        </View>
      ))}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: baseSpacing.base,
    borderRadius: 12,
    borderWidth: 1,
  },
});

