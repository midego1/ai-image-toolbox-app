import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'app_language';

export type Language = 'automatic' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko';

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'automatic', label: 'Automatic', nativeLabel: 'Automatic' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
];

export class LanguageService {
  static async getLanguage(): Promise<Language> {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      return (language as Language) || 'automatic';
    } catch (error) {
      console.error('Failed to get language:', error);
      return 'automatic';
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
    if (!option) return 'Automatic (English)';
    
    if (language === 'automatic') {
      return 'Automatic (English)';
    }
    return option.nativeLabel;
  }
}

