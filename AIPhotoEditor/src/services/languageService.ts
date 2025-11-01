import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'app_language';

export type Language = 'en' | 'other';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
  disabled?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'other', label: 'Other Languages', nativeLabel: 'Not available right now', disabled: true },
];

export class LanguageService {
  static async getLanguage(): Promise<Language> {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      return (language as Language) || 'en';
    } catch (error) {
      console.error('Failed to get language:', error);
      return 'en';
    }
  }

  static async setLanguage(language: Language): Promise<void> {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }

  static getLanguageLabel(language: Language): string {
    const option = LANGUAGES.find(l => l.code === language);
    return option ? option.label : 'Unknown';
  }

  static getLanguageDisplayText(language: Language): string {
    const option = LANGUAGES.find(l => l.code === language);
    if (!option) return 'English';

    return option.nativeLabel;
  }
}

