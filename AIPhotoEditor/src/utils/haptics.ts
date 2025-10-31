import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VIBRATIONS_ENABLED_KEY = 'vibrations_enabled';

// Cache for vibration preference - defaults to true
let vibrationsEnabledCache: boolean | null = null;

// Initialize the cache
AsyncStorage.getItem(VIBRATIONS_ENABLED_KEY).then((value) => {
  vibrationsEnabledCache = value === null ? true : value === 'true';
}).catch(() => {
  vibrationsEnabledCache = true;
});

// Function to update the cache (called when settings change)
export const updateVibrationsCache = async (): Promise<void> => {
  try {
    const value = await AsyncStorage.getItem(VIBRATIONS_ENABLED_KEY);
    vibrationsEnabledCache = value === null ? true : value === 'true';
  } catch (error) {
    vibrationsEnabledCache = true;
  }
};

const shouldVibrate = (): boolean => {
  // If cache is not initialized, default to enabled
  return vibrationsEnabledCache !== false;
};

export const haptic = {
  light: () => {
    if (!shouldVibrate()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  medium: () => {
    if (!shouldVibrate()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  heavy: () => {
    if (!shouldVibrate()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  success: () => {
    if (!shouldVibrate()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  error: () => {
    if (!shouldVibrate()) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  selection: () => {
    if (!shouldVibrate()) return;
    try {
      Haptics.selectionAsync();
    } catch (error) {
      // Haptics not available on this device
    }
  },
};
