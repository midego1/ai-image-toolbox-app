import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_MODE_KEY = 'theme_mode';
const FONT_SIZE_KEY = 'font_size';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSize = 'small' | 'medium' | 'large';

export class ThemeService {
  static async getThemeMode(): Promise<ThemeMode> {
    try {
      const mode = await AsyncStorage.getItem(THEME_MODE_KEY);
      return (mode as ThemeMode) || 'system';
    } catch (error) {
      console.error('Failed to get theme mode:', error);
      return 'system';
    }
  }

  static async setThemeMode(mode: ThemeMode): Promise<void> {
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }

  static async getFontSize(): Promise<FontSize> {
    try {
      const size = await AsyncStorage.getItem(FONT_SIZE_KEY);
      return (size as FontSize) || 'medium';
    } catch (error) {
      console.error('Failed to get font size:', error);
      return 'medium';
    }
  }

  static async setFontSize(size: FontSize): Promise<void> {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
    } catch (error) {
      console.error('Failed to save font size:', error);
    }
  }
}

