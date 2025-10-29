import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

interface SettingItemProps {
  icon?: React.ReactNode | string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  iconColor?: string;
  style?: ViewStyle;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showSeparator?: boolean;
  // For custom subtitle rendering (e.g., machine status)
  customSubtitle?: React.ReactNode;
  // For icon name when using Ionicons
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  // Premium badge support
  showPremiumBadge?: boolean;
  // Custom right icon (overrides showChevron)
  rightIcon?: 'chevron' | 'lock' | React.ReactNode;
  // Disabled/locked state
  disabled?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  customSubtitle,
  onPress,
  showChevron = true,
  iconColor,
  iconName,
  iconSize = 20,
  style,
  isFirstInGroup = false,
  isLastInGroup = false,
  showSeparator = false,
  showPremiumBadge = false,
  rightIcon,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handlePress = () => {
    if (onPress) {
      haptic.light();
      onPress();
    }
  };

  // Determine if this is a standalone card (single item, both first and last)
  const isStandalone = isFirstInGroup && isLastInGroup && !showSeparator;

  const renderIcon = () => {
    // If iconName is provided, use Ionicons
    if (iconName) {
      return (
        <View style={[styles.iconContainer, { marginRight: spacing.base, backgroundColor: iconColor ? iconColor + '20' : colors.surfaceElevated }]}>
          <Ionicons name={iconName} size={iconSize} color={iconColor || colors.primary} />
        </View>
      );
    }
    
    // If icon is a string (emoji), render as text
    if (icon && typeof icon === 'string') {
      return (
        <View style={[styles.iconContainer, { marginRight: spacing.base, backgroundColor: iconColor ? iconColor + '20' : colors.surfaceElevated }]}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>
      );
    }
    
    // Otherwise, render as React node
    if (icon) {
      return (
        <View style={[styles.iconContainer, { marginRight: spacing.base, backgroundColor: iconColor ? iconColor + '20' : colors.surfaceElevated }]}>
          {icon}
        </View>
      );
    }
    
    return null;
  };

  const renderSubtitle = () => {
    if (customSubtitle) {
      return customSubtitle;
    }
    if (subtitle) {
      return (
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm, lineHeight: 18 }]} numberOfLines={1}>
          {subtitle}
        </Text>
      );
    }
    return null;
  };

  const renderRightIcon = () => {
    // Custom right icon (ReactNode) takes precedence
    if (rightIcon && typeof rightIcon !== 'string') {
      return rightIcon;
    }
    
    // String right icon options
    if (rightIcon === 'lock') {
      return (
        <Ionicons
          name="lock-closed"
          size={20}
          color={colors.textTertiary}
        />
      );
    }
    
    // Default: show chevron if needed
    if ((rightIcon === 'chevron' || showChevron) && onPress) {
      return (
        <Text style={[styles.chevron, { color: colors.textTertiary, fontSize: typography.scaled.base, fontWeight: typography.weight.medium }]}>
          {'>'}
        </Text>
      );
    }
    
    return null;
  };

  // Calculate border radius - match Features page approach
  // First item gets top radius, last item gets bottom radius, middle items get none
  const getBorderRadius = () => {
    if (isStandalone) {
      // Standalone items get all corners rounded
      return {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      };
    }
    // Grouped items: first gets top radius, last gets bottom radius
    return {
      borderTopLeftRadius: isFirstInGroup ? 12 : 0,
      borderTopRightRadius: isFirstInGroup ? 12 : 0,
      borderBottomLeftRadius: isLastInGroup ? 12 : 0,
      borderBottomRightRadius: isLastInGroup ? 12 : 0,
    };
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          // Match featureCard exactly from Features page
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.sm,
          marginBottom: 0, // Cards touch each other (no margin between grouped items)
          elevation: 0,
          shadowOpacity: 0,
          // Apply border radius exactly like featureCard
          ...getBorderRadius(),
        },
        style,
        disabled && { opacity: 0.6 },
      ]}
      onPress={handlePress}
      disabled={!onPress || disabled}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {renderIcon()}
      <View style={styles.textContainer}>
        <View style={[styles.titleRow, { marginBottom: (subtitle || customSubtitle) ? 2 : 0 }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.semibold }]}>
            {title}
          </Text>
          {showPremiumBadge && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.warning, marginLeft: spacing.xs }]}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
        </View>
        {renderSubtitle()}
      </View>
      <View style={[styles.rightContainer, { gap: spacing.sm }]}>
        {value && <Text style={[styles.value, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginRight: spacing.xs }]}>{value}</Text>}
        {renderRightIcon()}
      </View>
      {showSeparator && (
        <View
          style={[
            styles.separator,
            {
              backgroundColor: colors.border,
              left: spacing.base + 40 + spacing.base,
              right: spacing.base,
            }
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Match featureCard exactly
    position: 'relative', // Match featureCard exactly
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    // Dynamic styles applied inline
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    // Dynamic styles applied inline
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    // Dynamic styles applied inline
  },
  chevron: {
    // Dynamic styles applied inline
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
