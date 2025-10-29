import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { IconButton } from './IconButton';

interface SettingsHeaderProps {
  title?: string;
  leftAction?: {
    icon?: string;
    onPress: () => void;
  };
  hideTopEdge?: boolean;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title = 'Settings',
  leftAction,
  hideTopEdge = false,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const edges: ('top' | 'bottom' | 'left' | 'right')[] = hideTopEdge ? [] : ['top'];

  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: spacing.base, paddingTop: hideTopEdge ? spacing.md : spacing.base, paddingBottom: spacing.sm }]}>
        <View style={styles.leftSection}>
          {leftAction && leftAction.icon ? (
            <IconButton
              name={leftAction.icon}
              onPress={leftAction.onPress}
              color={colors.textTertiary}
              backgroundColor="transparent"
            />
          ) : (
            <View style={styles.leftPlaceholder} />
          )}
        </View>
        <View style={[styles.centerSection]}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
            {title}
          </Text>
        </View>
        <View style={styles.rightSection} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 44,
  },
  title: {
    // Dynamic styles applied inline
  },
  leftPlaceholder: {
    width: 44,
    height: 44,
  },
});

