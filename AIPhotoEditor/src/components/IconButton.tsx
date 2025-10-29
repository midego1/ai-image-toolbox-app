import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

// Common icon names used in the app - using iOS-style icons (Ionicons)
type IconName = 
  | 'chevron-back-outline'
  | 'images'
  | 'camera-reverse'
  | string; // Allow any string for flexibility

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  onPress,
  size = 24,
  color,
  backgroundColor,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.text;
  
  const handlePress = () => {
    if (!disabled) {
      haptic.light();
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: backgroundColor || (!disabled ? theme.colors.overlayLight : 'transparent') },
        style,
        disabled && { opacity: 0.5 },
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={name as any} 
        size={size} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

