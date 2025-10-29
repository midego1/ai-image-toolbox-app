import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { IconButton } from './IconButton';
import { haptic } from '../utils/haptics';

interface HeaderProps {
  title?: string;
  titleIcon?: string; // Emoji or icon string to display next to title
  leftAction?: {
    icon?: string;
    label?: string;
    onPress: () => void;
  };
  rightAction?: {
    icon?: string;
    label?: string;
    onPress: () => void;
  };
  transparent?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  titleIcon,
  leftAction,
  rightAction,
  transparent = false,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <SafeAreaView edges={['top']} style={transparent ? styles.transparent : [styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.base, paddingVertical: spacing.sm }]}>
        <View style={styles.left}>
          {leftAction ? (
            leftAction.icon ? (
              <IconButton
                name={leftAction.icon}
                onPress={leftAction.onPress}
                color={colors.primary}
                backgroundColor="transparent"
              />
            ) : (
              <TouchableOpacity
                style={[styles.textButton, { padding: spacing.sm }]}
                onPress={() => {
                  haptic.light();
                  leftAction.onPress();
                }}
              >
                <Text style={[styles.textButtonLabel, { fontSize: typography.scaled.base, fontWeight: typography.weight.semibold, color: colors.primary }]}>{leftAction.label}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {title && (
          <View style={styles.center}>
            <View style={styles.titleContainer}>
              {titleIcon && (
                <Text style={styles.titleIcon}>{titleIcon}</Text>
              )}
              <Text style={[styles.title, { fontSize: typography.scaled.lg, fontWeight: typography.weight.bold, color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.right}>
          {rightAction ? (
            rightAction.icon ? (
              <IconButton
                name={rightAction.icon}
                onPress={rightAction.onPress}
                color={colors.primary}
                backgroundColor="transparent"
              />
            ) : (
              <TouchableOpacity
                style={[styles.textButton, { padding: spacing.sm }]}
                onPress={() => {
                  haptic.light();
                  rightAction.onPress();
                }}
              >
                <Text style={[styles.textButtonLabel, { fontSize: typography.scaled.base, fontWeight: typography.weight.semibold, color: colors.primary }]}>{rightAction.label}</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor will be set dynamically
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    fontSize: 20,
  },
  title: {
    // fontSize, fontWeight, color set dynamically
  },
  textButton: {
    // padding set dynamically
  },
  textButtonLabel: {
    // fontSize, fontWeight, color set dynamically
  },
  placeholder: {
    width: 44,
  },
});

