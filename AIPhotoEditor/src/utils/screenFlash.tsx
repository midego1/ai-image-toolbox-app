import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Screen Flash Utility for Front-Facing Camera
 * 
 * Since front-facing cameras don't have physical flash, we use the screen as a flash:
 * 1. Temporarily maximize screen brightness (using expo-brightness)
 * 2. Display a white overlay during capture
 * 3. Restore brightness after capture
 */

interface UseScreenFlashOptions {
  flashDuration?: number; // Duration in milliseconds (default: 150ms)
  brightnessRestoreDelay?: number; // Delay before restoring brightness (default: 100ms)
}

/**
 * Custom hook for managing screen flash effect
 * Returns methods to trigger flash and a flash overlay component
 */
export function useScreenFlash(options: UseScreenFlashOptions = {}) {
  const { flashDuration = 150, brightnessRestoreDelay = 100 } = options;
  
  const [isFlashing, setIsFlashing] = useState(false);
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const brightnessRef = useRef<number | null>(null);

  /**
   * Trigger screen flash
   * This function:
   * 1. Stores current brightness
   * 2. Sets brightness to maximum
   * 3. Shows white overlay
   * 4. Restores brightness and hides overlay after duration
   */
  const triggerFlash = async (): Promise<void> => {
    try {
      // Import brightness module dynamically to avoid errors if not installed
      let Brightness: any = null;
      try {
        Brightness = require('expo-brightness');
      } catch (e) {
        console.warn('expo-brightness not installed. Flash will use overlay only.');
      }

      // Store current brightness if available
      if (Brightness) {
        try {
          brightnessRef.current = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1.0); // Max brightness
        } catch (e) {
          console.warn('Could not adjust screen brightness:', e);
        }
      }

      // Show flash overlay
      setIsFlashing(true);
      Animated.sequence([
        Animated.timing(flashOpacity, {
          toValue: 1,
          duration: 50, // Quick fade in
          useNativeDriver: true,
        }),
        Animated.delay(flashDuration - 100), // Hold at full brightness
        Animated.timing(flashOpacity, {
          toValue: 0,
          duration: 50, // Fade out
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsFlashing(false);
      });

      // Restore brightness after flash
      if (Brightness && brightnessRef.current !== null) {
        setTimeout(async () => {
          try {
            await Brightness.setBrightnessAsync(brightnessRef.current!);
          } catch (e) {
            console.warn('Could not restore screen brightness:', e);
            // Try to restore to a reasonable default if stored value fails
            try {
              await Brightness.setBrightnessAsync(0.5);
            } catch (e2) {
              console.warn('Could not set default brightness:', e2);
            }
          }
        }, flashDuration + brightnessRestoreDelay);
      }
    } catch (error) {
      console.error('Error triggering screen flash:', error);
      setIsFlashing(false);
    }
  };

  /**
   * Flash overlay component to render in camera screen
   */
  const FlashOverlay: React.FC = () => {
    if (!isFlashing) return null;

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#FFFFFF',
            opacity: flashOpacity,
            zIndex: 9999,
            pointerEvents: 'none',
          },
        ]}
      />
    );
  };

  return {
    triggerFlash,
    FlashOverlay,
    isFlashing,
  };
}

/**
 * Standalone function to trigger flash without hook
 * Useful for one-off flash triggers
 */
export async function triggerScreenFlash(
  duration: number = 150
): Promise<void> {
  try {
    // Import brightness module dynamically
    let Brightness: any = null;
    try {
      Brightness = require('expo-brightness');
      const currentBrightness = await Brightness.getBrightnessAsync();
      await Brightness.setBrightnessAsync(1.0);
      
      setTimeout(async () => {
        await Brightness.setBrightnessAsync(currentBrightness);
      }, duration);
    } catch (e) {
      console.warn('expo-brightness not available:', e);
    }
  } catch (error) {
    console.error('Error in screen flash:', error);
  }
}






