import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

const { width } = Dimensions.get('window');

export interface OptionSelectorOption {
  id: string;
  label: string;
  icon?: string;
  renderCustom?: (isSelected: boolean, onPress: () => void) => React.ReactNode;
}

export interface OptionSelectorProps {
  label: string;
  options: OptionSelectorOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  layout?: 'grid' | 'horizontal';
  columns?: number; // For grid layout
  containerStyle?: any;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({
  label,
  options,
  selectedId,
  onSelect,
  layout = 'grid',
  columns = 4,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handleSelect = (id: string) => {
    haptic.light();
    onSelect(id);
  };

  const renderOption = (option: OptionSelectorOption, useHorizontal: boolean = false) => {
    const isSelected = selectedId === option.id;

    if (option.renderCustom) {
      return option.renderCustom(isSelected, () => handleSelect(option.id));
    }

    // For horizontal layout, use fixed width buttons that don't shrink
    const buttonStyle = useHorizontal 
      ? [styles.optionButtonHorizontal, {
          backgroundColor: isSelected ? colors.primary : colors.background,
          borderColor: isSelected ? colors.primary : colors.border,
        }]
      : [styles.optionButton, {
          backgroundColor: isSelected ? colors.primary : colors.background,
          borderColor: isSelected ? colors.primary : colors.border,
        }];

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => handleSelect(option.id)}
        style={buttonStyle}
      >
        <View style={useHorizontal ? styles.optionContentHorizontal : styles.optionContent}>
          {option.icon && (
            <Text style={styles.optionIcon}>{option.icon}</Text>
          )}
          <Text
            style={[styles.optionText, {
              color: isSelected ? '#FFFFFF' : colors.text,
              fontSize: typography.scaled.sm,
              fontWeight: typography.weight.medium,
            }]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.8}
          >
            {option.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (layout === 'horizontal') {
    return (
      <View style={[containerStyle]}>
        <Text style={[styles.label, {
          color: colors.text,
          fontSize: typography.scaled.sm,
          fontWeight: typography.weight.medium,
          marginBottom: spacing.sm,
        }]}>
          {label}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
          style={styles.horizontalScrollView}
        >
          {options.map((option) => renderOption(option, true))}
        </ScrollView>
      </View>
    );
  }

  // Grid layout
  return (
    <View style={[containerStyle]}>
      <Text style={[styles.label, {
        color: colors.text,
        fontSize: typography.scaled.sm,
        fontWeight: typography.weight.medium,
        marginBottom: spacing.sm,
      }]}>
        {label}
      </Text>
      <View style={styles.gridContainer}>
        {options.map((option) => renderOption(option, false))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    // Dynamic styles applied inline
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: baseSpacing.sm,
  },
  horizontalScrollView: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    flexDirection: 'row',
    gap: baseSpacing.sm,
    paddingRight: baseSpacing.base,
  },
  optionButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseSpacing.xs / 2,
  },
  optionButtonHorizontal: {
    paddingVertical: baseSpacing.sm,
    paddingHorizontal: baseSpacing.base,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
    minHeight: 36,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseSpacing.xs / 2,
  },
  optionContentHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: baseSpacing.xs,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionText: {
    // Dynamic styles applied inline
    textAlign: 'center',
  },
});

