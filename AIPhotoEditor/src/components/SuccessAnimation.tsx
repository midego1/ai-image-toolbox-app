import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Animated } from 'react-native';
import { useTheme } from '../theme';

interface SuccessAnimationProps {
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Celebration animation sequence
    Animated.parallel([
      // Main scale and fade
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Checkmark animation after main animation
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }).start();
    });

    // Call onComplete after animation sequence
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.checkmarkContainer,
          {
            transform: [{ scale: checkmarkScale }],
          },
        ]}
      >
        <Text style={styles.checkmark}>✓</Text>
      </Animated.View>
      <Text
        style={[
          styles.successText,
          {
            color: colors.primary,
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            marginTop: spacing.lg,
          },
        ]}
      >
        Complete!
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: '#22c55e',
    fontWeight: 'bold',
  },
  successText: {
    textAlign: 'center',
  },
});




