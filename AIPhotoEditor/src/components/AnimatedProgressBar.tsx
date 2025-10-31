import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Animated } from 'react-native';
import { useTheme } from '../theme';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  currentStage?: number;
  totalStages?: number;
  showStages?: boolean;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  currentStage,
  totalStages,
  showStages = false,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar width
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  useEffect(() => {
    // Shimmer effect on progress bar
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const progressBarWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {showStages && currentStage !== undefined && totalStages !== undefined && (
        <Text
          style={[
            styles.stageText,
            {
              color: colors.textSecondary,
              fontSize: typography.scaled.sm,
              marginBottom: spacing.xs,
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            },
          ]}
        >
          Step {currentStage} of {totalStages}
        </Text>
      )}
      <View
        style={[
          styles.progressContainer,
          {
            backgroundColor: colors.surface,
            height: 6,
            borderRadius: 3,
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressBarWidth,
              backgroundColor: colors.primary,
              height: '100%',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.shimmer,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.3, 0.6, 0.3],
                }),
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  progressContainer: {
    overflow: 'hidden',
  },
  progressFill: {
    position: 'relative',
    borderRadius: 3,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '50%',
  },
  stageText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

