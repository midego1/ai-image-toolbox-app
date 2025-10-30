import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

interface SaveShareActionsProps {
  onSave: () => void;
  onShare: () => void;
  isSaving?: boolean;
  hasSaved?: boolean;
  containerStyle?: ViewStyle;
}

export const SaveShareActions: React.FC<SaveShareActionsProps> = ({
  onSave,
  onShare,
  isSaving = false,
  hasSaved = false,
  containerStyle,
}) => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;

  const handleSave = () => {
    if (!isSaving && !hasSaved) {
      haptic.light();
      onSave();
    }
  };

  const handleShare = () => {
    haptic.light();
    onShare();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSecondary,
          borderTopColor: colors.border,
          paddingHorizontal: spacing.base,
          paddingTop: spacing.md,
          paddingBottom: spacing.base,
        },
        containerStyle,
      ]}
    >
      <View style={styles.actionRow}>
        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: hasSaved ? colors.primary + '20' : colors.surface,
              borderColor: hasSaved ? colors.primary : colors.border,
              borderWidth: 1,
              borderRadius: 16,
              flex: 1,
              marginRight: spacing.sm,
              paddingVertical: spacing.lg,
            },
            (isSaving || hasSaved) && { opacity: hasSaved ? 1 : 0.6 },
          ]}
          onPress={handleSave}
          disabled={isSaving || hasSaved}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons
                name={hasSaved ? 'checkmark-circle' : 'download-outline'}
                size={20}
                color={hasSaved ? colors.primary : colors.text}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: hasSaved ? colors.primary : colors.text,
                    fontSize: typography.scaled.base,
                    fontWeight: typography.weight.semibold,
                  },
                ]}
              >
                {hasSaved ? 'Saved' : 'Save'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.primary,
              borderRadius: 16,
              flex: 1,
              paddingVertical: spacing.lg,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" style={styles.icon} />
          <Text
            style={[
              styles.buttonText,
              {
                color: '#FFFFFF',
                fontSize: typography.scaled.base,
                fontWeight: typography.weight.semibold,
              },
            ]}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    gap: 8,
  },
  icon: {
    marginRight: 0,
  },
  buttonText: {
    // Dynamic styles applied inline
  },
});

