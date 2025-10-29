/**
 * Design System - Spacing
 * Consistent spacing scale for margins, padding, and gaps
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 40,
  '4xl': 50,
  '5xl': 60,
} as const;

export type Spacing = typeof spacing;

/**
 * Common spacing patterns
 */
export const spacingPatterns = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  cardMargin: spacing.base,
  sectionGap: spacing.xl,
  buttonPadding: {
    horizontal: spacing.xl,
    vertical: spacing.base,
  },
  iconSize: {
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
  touchTarget: 44, // Minimum touch target size for accessibility
} as const;
