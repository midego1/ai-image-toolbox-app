import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { EditModeData } from '../types/editModes';

interface ProcessingHeaderProps {
  modeData?: EditModeData;
  progress?: number;
}

export const ProcessingHeader: React.FC<ProcessingHeaderProps> = ({ 
  modeData,
  progress,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={[styles.container, { marginBottom: spacing.md }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.icon, { fontSize: 32 }]}>
          {modeData?.icon || '✨'}
        </Text>
        <Text
          style={[
            styles.title,
            {
              color: colors.primary,
              fontSize: typography.size.xl,
              fontWeight: typography.weight.semibold,
              textShadowColor: 'rgba(0, 0, 0, 0.8)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            },
          ]}
        >
          {modeData?.name || 'Processing'}
        </Text>
        {progress !== undefined && (
          <View style={[styles.progressBadge, {
            backgroundColor: colors.primary + '20',
            borderColor: colors.primary + '40',
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs / 2,
            borderRadius: 12,
            borderWidth: 1,
          }]}>
            <Text
              style={[
                styles.progressPercent,
                {
                  color: colors.primary,
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                },
              ]}
            >
              {Math.round(progress)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  icon: {
    // fontSize: 32 handled inline
  },
  title: {
    textAlign: 'center',
  },
  progressBadge: {
    marginLeft: 6,
  },
  progressPercent: {
    // Dynamic styling applied inline
  },
});

