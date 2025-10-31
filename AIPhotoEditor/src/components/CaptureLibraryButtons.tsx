import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { spacing as baseSpacing } from '../theme/spacing';

interface CaptureLibraryButtonsProps {
  onCapture: () => void;
  onLibrary: () => void;
  cardScale?: Animated.Value;
}

export const CaptureLibraryButtons: React.FC<CaptureLibraryButtonsProps> = ({
  onCapture,
  onLibrary,
  cardScale = new Animated.Value(1),
}) => {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Animated.View style={[styles.ctaGrid, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.ctaCard, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '26' }]}
        onPress={onCapture}
      >
        <View style={[styles.ctaIconCircle, { backgroundColor: colors.primary + '22' }]}>
          <Ionicons name="camera-outline" size={24} color={colors.primary} />
        </View>
        <Text style={{ marginTop: 8, color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }}>
          Capture
        </Text>
        <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: typography.scaled.sm }}>
          Take your picture
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.ctaCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        onPress={onLibrary}
      >
        <View style={[styles.ctaIconCircle, { backgroundColor: colors.surface }]}>
          <Ionicons name="images-outline" size={24} color={colors.textSecondary} />
        </View>
        <Text style={{ marginTop: 8, color: colors.text, fontSize: typography.scaled.base, fontWeight: typography.weight.bold }}>
          Library
        </Text>
        <Text style={{ marginTop: 2, color: colors.textSecondary, fontSize: typography.scaled.sm }}>
          Photo Roll
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ctaGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: baseSpacing.base,
    justifyContent: 'space-between',
  },
  ctaCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

