import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTO_SAVE_ORIGINALS_KEY = 'auto_save_originals';
const VIBRATIONS_ENABLED_KEY = 'vibrations_enabled';

export class SettingsService {
  /**
   * Get the auto-save originals preference
   * @returns true if auto-save is enabled, false otherwise (default: false)
   */
  static async getAutoSaveOriginals(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AUTO_SAVE_ORIGINALS_KEY);
      if (value === null) {
        // Default to false if not set
        return false;
      }
      return value === 'true';
    } catch (error) {
      console.error('Failed to get auto-save originals setting:', error);
      return false;
    }
  }

  /**
   * Set the auto-save originals preference
   * @param enabled - Whether auto-save should be enabled
   */
  static async setAutoSaveOriginals(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTO_SAVE_ORIGINALS_KEY, enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save auto-save originals setting:', error);
      throw error;
    }
  }

  /**
   * Get the vibrations preference
   * @returns true if vibrations are enabled, false otherwise (default: true)
   */
  static async getVibrationsEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(VIBRATIONS_ENABLED_KEY);
      if (value === null) {
        // Default to true if not set
        return true;
      }
      return value === 'true';
    } catch (error) {
      console.error('Failed to get vibrations setting:', error);
      return true;
    }
  }

  /**
   * Set the vibrations preference
   * @param enabled - Whether vibrations should be enabled
   */
  static async setVibrationsEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(VIBRATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save vibrations setting:', error);
      throw error;
    }
  }
}



