import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, onPress, style, disabled = false }) => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const handlePress = () => {
    if (!disabled && onPress) {
      haptic.light();
      onPress();
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.sm,
          marginBottom: spacing.base,
        },
        style,
        disabled && { opacity: 0.5 },
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    // Styles set dynamically
  },
});

