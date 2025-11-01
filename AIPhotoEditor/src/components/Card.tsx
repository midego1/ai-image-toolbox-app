import React, { useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

interface CardProps {
  // Flexible content mode: if title is not provided, render children
  children?: React.ReactNode;
  
  // Structured list item mode: if title is provided, render structured layout
  title?: string;
  icon?: React.ReactNode | string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  subtitle?: string | React.ReactNode;
  value?: string | React.ReactNode;
  customSubtitle?: React.ReactNode;
  
  // Common props
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  
  // Grouped items (for list mode)
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showSeparator?: boolean;
  
  // Advanced features
  showChevron?: boolean;
  showPremiumBadge?: boolean;
  rightIcon?: 'chevron' | 'lock' | React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  icon,
  iconName,
  iconSize = 20,
  iconColor,
  subtitle,
  value,
  customSubtitle,
  onPress,
  disabled = false,
  style,
  isFirstInGroup = false,
  isLastInGroup = false,
  showSeparator = false,
  showChevron = true,
  showPremiumBadge = false,
  rightIcon,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const lockShakeAnimation = useRef(new Animated.Value(0)).current;
  const isLocked = disabled && rightIcon === 'lock';

  const animateLock = () => {
    // Reset animation value
    lockShakeAnimation.setValue(0);
    
    // Create shake animation
    Animated.sequence([
      Animated.timing(lockShakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(lockShakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(lockShakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(lockShakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(lockShakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Trigger vibration
    haptic.error();
  };

  const handlePress = () => {
    // If it's a locked feature, animate and vibrate but don't call onPress
    if (isLocked) {
      animateLock();
      return;
    }
    
    if (!disabled && onPress) {
      haptic.light();
      onPress();
    }
  };

  // Determine mode: structured list item (has title) or flexible content (has children)
  const isStructuredMode = !!title;
  const isStandalone = isFirstInGroup && isLastInGroup && !showSeparator;

  // Border radius calculation (for grouped items)
  const getBorderRadius = () => {
    if (!isStructuredMode) return { borderRadius: 16 }; // Flexible cards always rounded
    
    if (isStandalone) {
      return {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
      };
    }
    return {
      borderTopLeftRadius: isFirstInGroup ? 12 : 0,
      borderTopRightRadius: isFirstInGroup ? 12 : 0,
      borderBottomLeftRadius: isLastInGroup ? 12 : 0,
      borderBottomRightRadius: isLastInGroup ? 12 : 0,
    };
  };

  // Render icon for structured mode
  const renderIcon = () => {
    if (!isStructuredMode) return null;

    if (iconName) {
      return (
        <View style={[styles.iconContainer, { marginRight: spacing.base, backgroundColor: iconColor ? iconColor + '20' : colors.surfaceElevated }]}>
          <Ionicons name={iconName} size={iconSize} color={iconColor || colors.primary} />
        </View>
      );
    }
    
    if (icon && typeof icon === 'string') {
      return (
        <View style={[styles.iconContainer, { marginRight: spacing.base, backgroundColor: iconColor ? iconColor + '20' : colors.surfaceElevated }]}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>
      );
    }
    
    if (icon) {
      return (
        <View style={[styles.iconContainer, { marginRight: spacing.base, backgroundColor: iconColor ? iconColor + '20' : colors.surfaceElevated }]}>
          {icon}
        </View>
      );
    }
    
    return null;
  };

  // Render subtitle for structured mode
  const renderSubtitle = () => {
    if (!isStructuredMode) return null;
    
    if (customSubtitle) {
      return customSubtitle;
    }
    if (subtitle) {
      if (typeof subtitle === 'string') {
        return (
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm, lineHeight: 18 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        );
      } else {
        return subtitle;
      }
    }
    return null;
  };

  // Render right icon for structured mode
  const renderRightIcon = () => {
    if (!isStructuredMode) return null;
    
    if (rightIcon && typeof rightIcon !== 'string') {
      return rightIcon;
    }
    
    if (rightIcon === 'lock') {
      return (
        <Animated.View
          style={{
            transform: [{ translateX: lockShakeAnimation }],
          }}
        >
          <Ionicons
            name="lock-closed"
            size={20}
            color={colors.textTertiary}
          />
        </Animated.View>
      );
    }
    
    if ((rightIcon === 'chevron' || showChevron) && onPress) {
      return (
        <Text style={[styles.chevron, { color: colors.textTertiary, fontSize: typography.scaled.base, fontWeight: typography.weight.medium }]}>
          {'>'}
        </Text>
      );
    }
    
    return null;
  };

  const Component = onPress ? TouchableOpacity : View;

  // Base styles
  const baseStyles = {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    ...getBorderRadius(),
  };

  // Structured mode: render list item layout
  if (isStructuredMode) {
    return (
      <TouchableOpacity
        style={[
          styles.structuredContainer,
          baseStyles,
          {
            marginBottom: 0, // Cards touch each other in groups
            elevation: 0,
            shadowOpacity: 0,
          },
          style,
          disabled && !isLocked && { opacity: 0.6 },
        ]}
        onPress={handlePress}
        disabled={Boolean(!onPress || (disabled && !isLocked))}
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
          {value && (
            typeof value === 'string' ? (
              <Text style={[styles.value, { color: colors.textSecondary, fontSize: typography.scaled.sm, marginRight: spacing.xs }]}>
                {value}
              </Text>
            ) : (
              <View style={{ alignItems: 'flex-end', marginRight: spacing.xs }}>
                {value}
              </View>
            )
          )}
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
  }

  // Flexible mode: render children
  return (
    <Component
      style={[
        baseStyles,
        {
          marginBottom: spacing.base,
        },
        style,
        disabled && { opacity: 0.5 },
      ]}
      onPress={handlePress}
      disabled={Boolean(disabled)}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  structuredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
