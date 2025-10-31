import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Floating Tab Bar Dimensions (matching NativeFloatingTabBar.tsx):
 * - Bottom offset: 20px
 * - Min height: 52px
 * - Padding top: 6px
 * - Padding bottom: 8px
 * Total height: ~66px + safe area
 * Total bottom offset: 20px + 66px + safe area = ~86px + safe area
 */

export const TAB_BAR_BOTTOM_OFFSET = 20;
export const TAB_BAR_MIN_HEIGHT = 52;
export const TAB_BAR_PADDING_TOP = 6;
export const TAB_BAR_PADDING_BOTTOM = 8;
export const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_MIN_HEIGHT + TAB_BAR_PADDING_TOP + TAB_BAR_PADDING_BOTTOM;
export const TAB_BAR_TOTAL_OFFSET = TAB_BAR_BOTTOM_OFFSET + TAB_BAR_TOTAL_HEIGHT;

/**
 * Get scroll bottom padding as a hook (for use in components)
 * Calculates the bottom padding needed for ScrollView content to account for:
 * 1. Floating tab bar (positioned absolutely at bottom)
 * 2. Safe area insets
 * 3. Optional additional spacing for buttons (e.g., generate button, action buttons)
 * 
 * @param additionalSpacing - Additional spacing in pixels (default: 16px for comfortable spacing)
 * @param includeSafeArea - Whether to include safe area insets (default: true)
 * @returns Bottom padding value in pixels
 */
export function useScrollBottomPadding(
  additionalSpacing: number = 16,
  includeSafeArea: boolean = true
): number {
  const insets = useSafeAreaInsets();
  const safeAreaBottom = includeSafeArea ? insets.bottom : 0;
  
  return TAB_BAR_TOTAL_OFFSET + safeAreaBottom + additionalSpacing;
}

/**
 * Calculate padding for ScrollView when action buttons are visible
 * ActionButtonBar typically adds ~100px (button 56px + padding + timing info)
 * 
 * @param actionButtonHeight - Height of action button bar in pixels (default: 100)
 * @returns Bottom padding value in pixels
 */
export function useScrollBottomPaddingWithActionButton(
  actionButtonHeight: number = 100
): number {
  const insets = useSafeAreaInsets();
  const spacing = 16; // Comfortable spacing between button and tab bar
  
  return TAB_BAR_TOTAL_OFFSET + insets.bottom + actionButtonHeight + spacing;
}

/**
 * Get the total height of the floating tab bar area
 * Useful for absolute positioning calculations
 * 
 * @returns Total height in pixels (including safe area)
 */
export function useFloatingTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_TOTAL_OFFSET + insets.bottom;
}

