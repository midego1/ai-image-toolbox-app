/**
 * Design System - Main Export
 * Centralized export for all theme constants
 */

export { colors, darkColors, lightColors } from './colors';
export { typography } from './typography';
export { spacing, spacingPatterns } from './spacing';
export { ThemeProvider, useTheme } from './ThemeProvider';

export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  spacingPatterns: require('./spacing').spacingPatterns,
};

