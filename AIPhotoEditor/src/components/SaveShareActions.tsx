import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as spacingConstants } from '../theme/spacing';

interface SaveShareActionsProps {
  onSave: () => void;
  onShare: () => void;
  isSaving?: boolean;
  hasSaved?: boolean;
  containerStyle?: ViewStyle;
  /**
   * Variant of the component:
   * - 'floating': Floating buttons that overlay content (default, most space-efficient)
   * - 'inline': Traditional fixed bar at bottom (takes up space)
   */
  variant?: 'floating' | 'inline';
  /**
   * Compact mode - makes buttons smaller (smaller icons, text, and padding)
   */
  compact?: boolean;
}

/**
 * SaveShareActions - Reusable save and share action buttons
 * 
 * UX Design Options:
 * 1. Floating (default): Icon buttons that float over content - doesn't take fixed space
 * 2. Inline: Traditional bottom bar - takes fixed space but more discoverable
 * 
 * Floating variant is recommended for result screens as it:
 * - Maximizes content visibility
 * - Doesn't push content up
 * - Always accessible
 * - Modern UX pattern (like Instagram, VSCO)
 */
export const SaveShareActions: React.FC<SaveShareActionsProps> = ({
  onSave,
  onShare,
  isSaving = false,
  hasSaved = false,
  containerStyle,
  variant = 'floating',
  compact = false,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const insets = useSafeAreaInsets();

  // Calculate bottom offset to account for floating tab bar
  // Tab bar is positioned at bottom: 20px + safe area
  // Tab bar height: ~52px
  // We want buttons to float above the tab bar with comfortable spacing
  const TAB_BAR_BOTTOM = 20; // Tab bar bottom offset
  const TAB_BAR_HEIGHT = 52;
  const SPACING_ABOVE_TAB_BAR = 12;
  
  // For floating variant, position above tab bar
  // Position = tab bar bottom offset + tab bar height + safe area + spacing
  const floatingBottom = TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + insets.bottom + SPACING_ABOVE_TAB_BAR;
  
  // For inline variant, calculate padding for fixed positioning
  const TAB_BAR_PADDING = 6;
  const inlineBottomPadding = TAB_BAR_HEIGHT + TAB_BAR_PADDING + insets.bottom + SPACING_ABOVE_TAB_BAR;

  const handleSave = () => {
    if (!isSaving && !hasSaved) {
      haptic.light();
      onSave();
    }
  };

  const handleShare = () => {
    haptic.light();
    onShare();
  };

  // Floating variant - absolutely positioned, overlays content
  if (variant === 'floating') {
    // Use a darker, richer background with blur effect
    const barBackgroundColor = colors.isDark 
      ? 'rgba(28, 28, 30, 0.95)' // Dark with slight transparency
      : 'rgba(255, 255, 255, 0.95)'; // Light with slight transparency
    
    return (
      <View
        style={[
          styles.floatingContainer,
          {
            bottom: floatingBottom,
            left: spacing.base,
            right: spacing.base,
          },
          containerStyle,
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.floatingBar,
            {
              backgroundColor: barBackgroundColor,
              borderRadius: compact ? 20 : 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 12,
              borderWidth: 1,
              borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              paddingHorizontal: compact ? spacingConstants.xs / 2 : spacingConstants.xs,
              paddingVertical: compact ? spacingConstants.xs / 2 : spacingConstants.xs,
              minHeight: compact ? 44 : 56,
            },
          ]}
        >
          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: hasSaved 
                  ? colors.primary + '20' 
                  : colors.isDark 
                    ? 'rgba(255, 255, 255, 0.08)' 
                    : 'rgba(0, 0, 0, 0.04)',
                paddingVertical: compact ? spacingConstants.xs / 2 : spacingConstants.sm,
                paddingHorizontal: compact ? spacingConstants.xs : spacingConstants.sm,
                minHeight: compact ? 36 : 48,
                borderRadius: 20,
              },
              (isSaving || hasSaved) && { opacity: hasSaved ? 1 : 0.6 },
            ]}
            onPress={handleSave}
            disabled={isSaving || hasSaved}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.floatingButtonContent}>
                <Ionicons
                  name={hasSaved ? 'checkmark-circle' : 'download-outline'}
                  size={compact ? 18 : 22}
                  color={hasSaved ? colors.primary : colors.text}
                />
                <Text
                  style={[
                    styles.floatingButtonLabel,
                    {
                      color: hasSaved ? colors.primary : colors.text,
                      fontSize: compact ? typography.scaled.xs * 0.85 : typography.scaled.xs,
                      fontWeight: typography.weight.semibold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {hasSaved ? 'Saved' : 'Save'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.divider, { 
            backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            height: compact ? 24 : 32,
          }]} />

          {/* Share Button */}
          <TouchableOpacity
            style={[
              styles.floatingButton,
              {
                backgroundColor: colors.primary,
                paddingVertical: compact ? spacingConstants.xs / 2 : spacingConstants.sm,
                paddingHorizontal: compact ? spacingConstants.xs : spacingConstants.sm,
                minHeight: compact ? 36 : 48,
                borderRadius: 20,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
              },
            ]}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <View style={styles.floatingButtonContent}>
              <Ionicons name="share-outline" size={compact ? 18 : 22} color="#FFFFFF" />
              <Text
                style={[
                  styles.floatingButtonLabel,
                  {
                    color: '#FFFFFF',
                    fontSize: compact ? typography.scaled.xs * 0.85 : typography.scaled.xs,
                    fontWeight: typography.weight.semibold,
                  },
                ]}
                numberOfLines={1}
              >
                Share
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Inline variant - traditional fixed bottom bar
  return (
    <View
      style={[
        styles.inlineContainer,
        {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.base,
          paddingTop: spacing.sm,
          paddingBottom: inlineBottomPadding,
        },
        containerStyle,
      ]}
    >
      <View style={styles.actionRow}>
        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: hasSaved ? colors.primary + '20' : colors.surface,
              borderColor: hasSaved ? colors.primary : colors.border,
              borderWidth: 1,
              borderRadius: 12,
              flex: 1,
              marginRight: spacing.xs,
              paddingVertical: spacing.sm,
            },
            (isSaving || hasSaved) && { opacity: hasSaved ? 1 : 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving || hasSaved}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name={hasSaved ? 'checkmark-circle' : 'download-outline'}
                size={18}
                color={hasSaved ? colors.primary : colors.text}
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: hasSaved ? colors.primary : colors.text,
                    fontSize: typography.scaled.sm,
                    fontWeight: typography.weight.semibold,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                {hasSaved ? 'Saved' : 'Save'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.primary,
              borderRadius: 12,
              flex: 1,
              marginLeft: spacing.xs,
              paddingVertical: spacing.sm,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            },
          ]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          <Text
            style={[
              styles.buttonText,
              {
                color: '#FFFFFF',
                fontSize: typography.scaled.sm,
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs,
              },
            ]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Floating variant styles
  floatingContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacingConstants.xs,
    paddingVertical: spacingConstants.xs,
    minHeight: 56,
  },
  floatingButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingConstants.sm,
    paddingHorizontal: spacingConstants.sm,
    borderRadius: 24,
    minHeight: 48,
  },
  floatingButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  floatingButtonLabel: {
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    marginHorizontal: spacingConstants.xs,
  },
  // Inline variant styles
  inlineContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    // Dynamic styles applied inline
  },
});

