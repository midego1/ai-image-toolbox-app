/**
 * Design System - Color Palette
 * Centralized color definitions for consistent theming
 */

// Dark theme colors (default) - iOS-inspired dark mode
export const darkColors = {
  // Background
  background: '#1C1C1E',           // Deep dark gray (iOS dark mode)
  backgroundSecondary: '#1C1C1E',  // Consistent dark background
  surface: '#2C2C2E',              // Elevated surface (cards, groups)
  surfaceVariant: '#3A3A3C',       // Higher elevation
  surfaceElevated: '#48484A',      // Highest elevation

  // Primary
  primary: '#007AFF',              // iOS blue
  primaryDark: '#0056CC',
  primaryLight: '#5AC8FA',

  // Text
  text: '#FFFFFF',                 // Pure white for primary text
  textSecondary: '#8E8E93',        // Muted gray for secondary text
  textTertiary: '#636366',         // Even more muted for tertiary
  textDisabled: '#48484A',

  // Status
  success: '#32D74B',              // iOS green (slightly brighter)
  error: '#FF453A',                // iOS red (slightly brighter)
  warning: '#FF9F0A',              // iOS orange (slightly brighter)
  info: '#64D2FF',                 // iOS light blue

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(255, 255, 255, 0.08)',
  overlayMedium: 'rgba(255, 255, 255, 0.15)',
  overlayDark: 'rgba(0, 0, 0, 0.85)',

  // Borders
  border: 'rgba(255, 255, 255, 0.06)',      // Nearly invisible borders
  borderLight: 'rgba(255, 255, 255, 0.03)', // Ultra-subtle

  // Special
  watermark: 'rgba(255, 255, 255, 0.3)',
  shadow: 'rgba(0, 0, 0, 0.4)',
} as const;

// Light theme colors - Sepia/Financial Newspaper aesthetic
export const lightColors = {
  // Background - Warm cream/sepia tones like aged paper
  background: '#F5F1E8',           // Warm cream paper color
  backgroundSecondary: '#EFE9DD',  // Slightly deeper sepia
  surface: '#FAF8F3',              // Subtle, slightly lighter sepia for cards (soft contrast)
  surfaceElevated: '#F7F4ED',      // Subtle elevated surface with gentle differentiation

  // Primary
  primary: '#007AFF',
  primaryDark: '#0056CC',
  primaryLight: '#5AC8FA',

  // Text - Dark sepia/brown tones instead of pure black
  text: '#2C2416',                 // Rich dark brown (newspaper text)
  textSecondary: '#5C4A3A',        // Warm medium brown
  textTertiary: '#8B7A6B',         // Muted sepia gray-brown
  textDisabled: '#C4B8A9',         // Light sepia gray

  // Status
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',

  // Overlays - Warmer sepia-toned overlays
  overlay: 'rgba(44, 36, 22, 0.5)',      // Sepia-toned dark overlay
  overlayLight: 'rgba(92, 74, 58, 0.08)', // Subtle sepia overlay
  overlayMedium: 'rgba(92, 74, 58, 0.15)', // Medium sepia overlay
  overlayDark: 'rgba(44, 36, 22, 0.7)',    // Dark sepia overlay

  // Borders - Warm sepia borders
  border: 'rgba(92, 74, 58, 0.15)',       // Sepia-tinted borders
  borderLight: 'rgba(92, 74, 58, 0.08)',  // Subtle sepia borders

  // Special
  watermark: 'rgba(92, 74, 58, 0.25)',    // Sepia watermark
  shadow: 'rgba(44, 36, 22, 0.15)',       // Warm sepia shadow
} as const;

// Export dark colors as default for backward compatibility
export const colors = darkColors;

export type Colors = typeof darkColors | typeof lightColors;

