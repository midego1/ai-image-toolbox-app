import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { spacing as baseSpacing } from '../theme/spacing';

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  containerStyle?: any;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggle = () => {
    haptic.light();
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    }, containerStyle]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="settings-outline" size={18} color={colors.primary} />
          <Text style={[styles.title, {
            color: colors.text,
            fontSize: typography.scaled.sm,
            fontWeight: typography.weight.semibold,
            marginLeft: spacing.xs,
          }]}>
            {title}
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: baseSpacing.base,
    paddingVertical: baseSpacing.sm,
    minHeight: 48,
  },
  title: {
    // Dynamic styles applied inline
  },
  content: {
    paddingHorizontal: baseSpacing.base,
    paddingTop: baseSpacing.xs,
    paddingBottom: baseSpacing.base,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginBottom: baseSpacing.sm,
  },
});

