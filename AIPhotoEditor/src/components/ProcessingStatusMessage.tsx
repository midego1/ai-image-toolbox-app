import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated, View } from 'react-native';
import { useTheme } from '../theme';

interface ProcessingStatusMessageProps {
  message: string;
  estimatedTime?: number | null; // in seconds
  currentStage?: { index: number; total: number };
  compact?: boolean;
}

export const ProcessingStatusMessage: React.FC<ProcessingStatusMessageProps> = ({
  message,
  estimatedTime,
  currentStage,
  compact = false,
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
      return `${Math.ceil(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <Animated.View style={[styles.container, {
      marginBottom: compact ? spacing.sm : spacing.md,
    }, { opacity: fadeAnim }]}>
      <Text
        style={[
          styles.message,
          {
            color: colors.text,
            fontSize: compact ? typography.size.lg : typography.scaled.xl,
            fontWeight: typography.weight.semibold,
            marginBottom: compact ? spacing.xs : spacing.sm,
            textShadowColor: 'rgba(0, 0, 0, 0.9)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 5,
          },
        ]}
      >
        {message}
      </Text>
      {((estimatedTime !== null && estimatedTime !== undefined && estimatedTime > 0) || currentStage) && (
        <View style={[styles.metaCard, {
          backgroundColor: colors.surface + 'E6',
          borderColor: colors.primary + '40',
          borderWidth: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: 12,
          marginTop: spacing.xs,
        }]}>
          <View style={styles.metaRow}>
            {estimatedTime !== null && estimatedTime !== undefined && estimatedTime > 0 && (
              <>
                <Text
                  style={[
                    styles.metaText,
                    {
                      color: colors.text,
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.semibold,
                    },
                  ]}
                >
                  ~{formatTime(estimatedTime)}
                </Text>
                {currentStage && (
                  <Text style={[styles.separator, { 
                    color: colors.textSecondary, 
                    opacity: 0.5, 
                    marginHorizontal: spacing.sm,
                    fontSize: typography.size.sm,
                  }]}>
                    •
                  </Text>
                )}
              </>
            )}
            {currentStage && (
              <Text
                style={[
                  styles.metaText,
                  {
                    color: colors.primary,
                    fontSize: typography.size.sm,
                    fontWeight: typography.weight.bold,
                  },
                ]}
              >
                Step {currentStage.index + 1}/{currentStage.total}
              </Text>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
  },
  metaCard: {
    // Dynamic styling applied inline
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaText: {
    // Dynamic styling applied inline
  },
  separator: {
    // Dynamic styling applied inline
  },
});

