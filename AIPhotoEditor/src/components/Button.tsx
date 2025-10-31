import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  leftAdornment?: React.ReactNode;
  rightAdornment?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  leftAdornment,
  rightAdornment,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handlePress = () => {
    if (!disabled && !loading) {
      haptic.light();
      onPress();
    }
  };

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surface : 'transparent',
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: variant === 'secondary' ? colors.border : 'transparent',
    },
    size === 'small' && {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 36,
    },
    size === 'medium' && {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.base,
      minHeight: 48,
    },
    size === 'large' && {
      paddingHorizontal: spacing['2xl'],
      paddingVertical: spacing.lg,
      minHeight: 56,
    },
    fullWidth && { width: '100%' },
    (disabled || loading) && { opacity: 0.5 },
    style,
  ];

  const textStyles = [
    {
      fontWeight: typography.weight.semibold,
      color: variant === 'primary' ? colors.text : variant === 'secondary' ? colors.text : colors.primary,
      fontSize: size === 'small' ? typography.scaled.sm : size === 'medium' ? typography.scaled.base : typography.scaled.lg,
    },
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? colors.text : colors.primary} />
      ) : (
        <>
          {leftAdornment}
          {leftAdornment ? (
            <Text style={[textStyles, { marginLeft: spacing.xs }]}>{title}</Text>
          ) : (
            <Text style={textStyles}>{title}</Text>
          )}
          {rightAdornment && <Text style={{ marginLeft: spacing.sm }} />}
          {rightAdornment}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

