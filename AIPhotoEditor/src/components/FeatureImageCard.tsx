import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { EditMode, getEditMode } from '../constants/editModes';

interface FeatureImageCardProps {
  imageSource: ImageSourcePropType | null;
  name: string;
  editMode: EditMode;
  isPremium: boolean;
  onPress: () => void;
}

export const FeatureImageCard: React.FC<FeatureImageCardProps> = ({
  imageSource,
  name,
  editMode,
  isPremium,
  onPress,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const mode = getEditMode(editMode);
  const showPremiumBadge = mode?.isPremium;

  return (
    <TouchableOpacity
      style={[
        styles.toolButton,
        imageSource ? styles.toolButtonNoPadding : {},
        { backgroundColor: imageSource ? 'transparent' : colors.surface }
      ]}
      activeOpacity={0.7}
      onPress={() => {
        haptic.medium();
        onPress();
      }}
    >
      {imageSource ? (
        <>
          <Image
            source={imageSource}
            style={styles.toolCardImageFull}
            resizeMode="cover"
          />
          {showPremiumBadge && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.warning }]}>
              <Text style={styles.premiumText}>PRO</Text>
            </View>
          )}
          <View style={styles.toolLabelBadge}>
            <Text style={styles.toolLabelOnImage} numberOfLines={1}>
              {name}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.toolIcon}>🎨</Text>
          <Text style={[styles.toolLabel, { color: colors.text }]}>
            {name}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toolButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  toolButtonNoPadding: {
    padding: 0,
    borderWidth: 0,
  },
  toolIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  toolCardImageFull: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  toolLabelBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  toolLabelOnImage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

