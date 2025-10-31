import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';
import { EditModeData } from '../types/editModes';

interface ProcessingHeaderProps {
  modeData?: EditModeData;
}

export const ProcessingHeader: React.FC<ProcessingHeaderProps> = ({ modeData }) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{modeData?.icon || '✨'}</Text>
      <Text
        style={[
          styles.title,
          {
            color: colors.primary,
            fontSize: typography.size['2xl'],
            fontWeight: typography.weight.bold,
            marginTop: spacing.md,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          },
        ]}
      >
        {modeData?.name || 'Processing'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    textAlign: 'center',
  },
});

