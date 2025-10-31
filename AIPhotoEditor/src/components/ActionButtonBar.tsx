import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Button } from './Button';

interface ActionButtonBarProps {
  /**
   * The button component to render
   * This should be a Button component with your desired title and onPress
   */
  children: React.ReactNode;
  
  /**
   * Optional additional content below the button (e.g., timing info)
   */
  bottomContent?: React.ReactNode;
  
  /**
   * Additional style for the container
   */
  containerStyle?: ViewStyle;
  
  /**
   * Whether to show this bar (useful for conditional rendering)
   */
  visible?: boolean;
}

/**
 * ActionButtonBar - A consistent action button bar that accounts for tab bar height
 * 
 * This component ensures buttons don't overlap with the floating tab bar by:
 * - Calculating tab bar height (~52px minimum + safe area)
 * - Adding appropriate padding
 * - Using absolute positioning that respects tab bar space
 * 
 * Use this for Generate buttons and other primary actions in AI tool screens
 */
export const ActionButtonBar: React.FC<ActionButtonBarProps> = ({
  children,
  bottomContent,
  containerStyle,
  visible = true,
}) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  // Calculate bottom offset:
  // Tab bar height: ~52px (minHeight) + padding (6px top + safe area bottom)
  // Add extra spacing: 16px for comfortable separation
  // Total: ~52 + 6 + insets.bottom + 16 = ~74 + insets.bottom
  const TAB_BAR_HEIGHT = 52;
  const TAB_BAR_PADDING = 6;
  const SPACING_ABOVE_TAB_BAR = 16;
  const bottomOffset = TAB_BAR_HEIGHT + TAB_BAR_PADDING + insets.bottom + SPACING_ABOVE_TAB_BAR;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'transparent',
          paddingBottom: bottomOffset,
          paddingHorizontal: spacing.base,
          paddingTop: spacing.base,
        },
        containerStyle,
      ]}
    >
      <View style={styles.content}>
        {children}
      </View>
      {bottomContent && (
        <View style={styles.bottomContent}>
          {bottomContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  bottomContent: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
});


