import * as Haptics from 'expo-haptics';

export const haptic = {
  light: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  medium: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  heavy: () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  success: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  error: () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      // Haptics not available on this device
    }
  },
  selection: () => {
    try {
      Haptics.selectionAsync();
    } catch (error) {
      // Haptics not available on this device
    }
  },
};
