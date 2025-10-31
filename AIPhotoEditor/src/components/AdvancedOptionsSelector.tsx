import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

export interface AdvancedOption {
  id: string;
  label: string;
  icon?: string;
  /** Custom render function for special cases like color picker */
  renderCustom?: (isSelected: boolean, onPress: () => void) => React.ReactNode;
}

export interface AdvancedOptionsSelectorProps {
  /** Label shown on the left side */
  label: string;
  /** Emoji or icon shown before label (optional) */
  labelIcon?: string;
  /** Options to display */
  options: AdvancedOption[];
  /** Currently selected option ID */
  selectedId: string;
  /** Callback when option is selected */
  onSelect: (id: string) => void;
  /** Layout type - 'toggle' for 2 options side-by-side, 'horizontal' for scrollable row */
  layout?: 'toggle' | 'horizontal';
  /** Optional separator line after this selector */
  showSeparator?: boolean;
  /** Container style override */
  containerStyle?: any;
}

export const AdvancedOptionsSelector: React.FC<AdvancedOptionsSelectorProps> = ({
  label,
  labelIcon,
  options,
  selectedId,
  onSelect,
  layout = 'horizontal',
  showSeparator = false,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handleSelect = (id: string) => {
    haptic.light();
    onSelect(id);
  };

  const renderOption = (option: AdvancedOption) => {
    const isSelected = selectedId === option.id;

    if (option.renderCustom) {
      return option.renderCustom(isSelected, () => handleSelect(option.id));
    }

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => handleSelect(option.id)}
        style={[styles.bitDepthButton, {
          backgroundColor: isSelected ? colors.primary : colors.background,
          borderColor: isSelected ? colors.primary : colors.border,
        }]}
        activeOpacity={0.7}
      >
        {option.icon && (
          <Text style={styles.bitDepthIcon}>{option.icon}</Text>
        )}
        <Text style={[styles.bitDepthText, {
          color: isSelected ? '#FFFFFF' : colors.text,
          fontSize: typography.scaled.xs,
          fontWeight: typography.weight.medium,
        }]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (layout === 'toggle') {
    // Toggle layout: 2 options side by side
    if (options.length !== 2) {
      console.warn('Toggle layout requires exactly 2 options');
    }
    
    return (
      <View style={containerStyle}>
        <View style={styles.toggleContainer}>
          {options.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelect(option.id)}
                style={[styles.toggleOption, {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                }]}
                activeOpacity={0.7}
              >
                {option.icon && (
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                )}
                <Text style={[styles.toggleText, {
                  color: isSelected ? '#FFFFFF' : colors.text,
                  fontSize: typography.scaled.sm,
                  fontWeight: typography.weight.medium,
                  marginLeft: option.icon ? spacing.xs : 0,
                }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {showSeparator && (
          <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
        )}
      </View>
    );
  }

  // Horizontal layout: label on left, scrollable options on right
  return (
    <View style={containerStyle}>
      <View style={styles.bitDepthContainer}>
        <Text style={[styles.bitDepthLabel, {
          color: colors.text,
          fontSize: typography.scaled.xs,
          fontWeight: typography.weight.medium,
        }]}>
          {labelIcon && `${labelIcon} `}
          {label}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.bitDepthScrollView}
          contentContainerStyle={styles.bitDepthOptions}
        >
          {options.map((option) => renderOption(option))}
        </ScrollView>
      </View>
      {showSeparator && (
        <View style={[styles.separatorLine, { backgroundColor: colors.border }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    flexDirection: 'row',
    gap: baseSpacing.sm,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleText: {
    // Dynamic styles applied inline
  },
  bitDepthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: baseSpacing.md,
    paddingVertical: 0,
    minHeight: 44,
    height: 44,
  },
  bitDepthLabel: {
    // Dynamic styles applied inline
    minWidth: 90,
  },
  bitDepthScrollView: {
    flex: 1,
  },
  bitDepthOptions: {
    flexDirection: 'row',
    gap: baseSpacing.sm,
    paddingRight: baseSpacing.md,
  },
  bitDepthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 36,
    gap: baseSpacing.xs,
  },
  bitDepthIcon: {
    fontSize: 14,
  },
  bitDepthText: {
    // Dynamic styles applied inline
  },
  separatorLine: {
    height: StyleSheet.hairlineWidth,
    marginLeft: -baseSpacing.base,
    marginRight: -baseSpacing.base,
    marginVertical: baseSpacing.xs,
  },
});

