import AsyncStorage from '@react-native-async-storage/async-storage';
import { EditMode, EditModeConfig } from '../types/editModes';

const HISTORY_STORAGE_KEY = 'image_history';
const MAX_HISTORY_ENTRIES = 100; // Limit to prevent storage bloat

export interface HistoryEntry {
  id: string;              // Unique ID (timestamp-based)
  originalImageUri: string; // Original image URI
  transformedImageUri: string; // Transformed image URI
  editMode: EditMode;      // Which edit mode was used
  editModeName: string;     // Display name (e.g., "Transform")
  editModeIcon: string;     // Display icon/emoji
  config?: EditModeConfig; // Optional config (for virtual try-on, etc.)
  timestamp: number;       // Creation timestamp (ms since epoch)
}

export class HistoryService {
  /**
   * Get all history entries, sorted by most recent first
   */
  static async getHistoryEntries(): Promise<HistoryEntry[]> {
    try {
      const historyJson = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (!historyJson) {
        return [];
      }
      
      const entries: HistoryEntry[] = JSON.parse(historyJson);
      // Sort by timestamp descending (newest first)
      return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get history entries:', error);
      return [];
    }
  }

  /**
   * Add a new entry to history
   */
  static async addHistoryEntry(
    originalImageUri: string,
    transformedImageUri: string,
    editMode: EditMode,
    editModeName: string,
    editModeIcon: string,
    config?: EditModeConfig
  ): Promise<void> {
    try {
      const entries = await this.getHistoryEntries();
      
      const newEntry: HistoryEntry = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalImageUri,
        transformedImageUri,
        editMode,
        editModeName,
        editModeIcon,
        config,
        timestamp: Date.now(),
      };

      // Add to beginning of array
      entries.unshift(newEntry);

      // Limit to MAX_HISTORY_ENTRIES, remove oldest
      if (entries.length > MAX_HISTORY_ENTRIES) {
        entries.splice(MAX_HISTORY_ENTRIES);
      }

      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
      console.log(`[HistoryService] Added history entry: ${newEntry.id}`);
    } catch (error) {
      console.error('Failed to add history entry:', error);
      // Don't throw - history is non-critical
    }
  }

  /**
   * Remove a history entry by ID
   */
  static async removeHistoryEntry(id: string): Promise<void> {
    try {
      const entries = await this.getHistoryEntries();
      const filtered = entries.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
      console.log(`[HistoryService] Removed history entry: ${id}`);
    } catch (error) {
      console.error('Failed to remove history entry:', error);
      throw error;
    }
  }

  /**
   * Clear all history entries
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
      console.log('[HistoryService] Cleared all history entries');
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }

  /**
   * Get history entries filtered by edit mode
   */
  static async getHistoryEntriesByMode(editMode: EditMode): Promise<HistoryEntry[]> {
    const entries = await this.getHistoryEntries();
    return entries.filter(entry => entry.editMode === editMode);
  }

  /**
   * Get total number of history entries
   */
  static async getHistoryCount(): Promise<number> {
    const entries = await this.getHistoryEntries();
    return entries.length;
  }
}

