import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeService, ThemeMode, FontSize } from '../services/themeService';
import { lightColors, darkColors, Colors } from './colors';
import { typography, Typography, getFontSizes, FontSizeScale } from './typography';
import { spacing } from './spacing';

export interface Theme {
  colors: Colors;
  typography: Typography & { scaled: FontSizeScale };
  spacing: typeof spacing;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  fontSize: FontSize;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setFontSize: (size: FontSize) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [isInitialized, setIsInitialized] = useState(false);

  // Determine actual theme (resolving 'system' to 'light' or 'dark')
  const resolvedThemeMode = themeMode === 'system' ? (systemColorScheme || 'dark') : themeMode;
  const isDark = resolvedThemeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedThemeMode, savedFontSize] = await Promise.all([
          ThemeService.getThemeMode(),
          ThemeService.getFontSize(),
        ]);
        setThemeModeState(savedThemeMode);
        setFontSizeState(savedFontSize);
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadPreferences();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await ThemeService.setThemeMode(mode);
  };

  const setFontSize = async (size: FontSize) => {
    setFontSizeState(size);
    await ThemeService.setFontSize(size);
  };

  // Always create theme object (even during initialization)
  const theme: Theme = {
    colors,
    typography: {
      ...typography,
      scaled: getFontSizes(fontSize),
    },
    spacing,
    isDark,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        fontSize,
        setThemeMode,
        setFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

