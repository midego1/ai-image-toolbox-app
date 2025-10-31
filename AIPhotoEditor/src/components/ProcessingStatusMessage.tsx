import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';

interface ProcessingStatusMessageProps {
  message: string;
  estimatedTime?: number | null; // in seconds
}

export const ProcessingStatusMessage: React.FC<ProcessingStatusMessageProps> = ({
  message,
  estimatedTime,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in new messages
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [message]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.ceil(seconds)} seconds`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text
        style={[
          styles.message,
          {
            color: colors.text,
            fontSize: typography.scaled.lg,
            fontWeight: typography.weight.semibold,
            marginBottom: spacing.xs,
            textShadowColor: 'rgba(0, 0, 0, 0.85)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          },
        ]}
      >
        {message}
      </Text>
      {estimatedTime !== null && estimatedTime !== undefined && estimatedTime > 0 && (
        <Text
          style={[
            styles.timeEstimate,
            {
              color: colors.textSecondary,
              fontSize: typography.scaled.sm,
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            },
          ]}
        >
          ~{formatTime(estimatedTime)} remaining
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },
  message: {
    textAlign: 'center',
  },
  timeEstimate: {
    textAlign: 'center',
    marginTop: 4,
  },
});

