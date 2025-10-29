/**
 * Design System - Typography
 * Standardized font sizes, weights, and line heights
 */

export type FontSizeScale = {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
};

// Font size multipliers for different accessibility preferences
const FONT_SIZE_MULTIPLIERS = {
  small: 0.875, // 87.5% of base size
  medium: 1.0,  // 100% of base size
  large: 1.125, // 112.5% of base size
} as const;

export type FontSizeOption = keyof typeof FONT_SIZE_MULTIPLIERS;

// Base font sizes
const baseSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export function getFontSizes(sizeOption: FontSizeOption = 'medium'): FontSizeScale {
  const multiplier = FONT_SIZE_MULTIPLIERS[sizeOption];
  return {
    xs: Math.round(baseSizes.xs * multiplier),
    sm: Math.round(baseSizes.sm * multiplier),
    base: Math.round(baseSizes.base * multiplier),
    lg: Math.round(baseSizes.lg * multiplier),
    xl: Math.round(baseSizes.xl * multiplier),
    '2xl': Math.round(baseSizes['2xl'] * multiplier),
    '3xl': Math.round(baseSizes['3xl'] * multiplier),
    '4xl': Math.round(baseSizes['4xl'] * multiplier),
  };
}

export const typography = {
  // Font Sizes (base sizes - use scaled versions from theme for actual rendering)
  size: baseSizes,

  // Font Weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Predefined text styles (base - use scaled versions from theme)
  styles: {
    h1: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 1.4,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    captionBold: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 1.5,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
  },
} as const;

export type Typography = typeof typography;

