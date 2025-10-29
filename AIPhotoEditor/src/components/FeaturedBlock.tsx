import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { EditMode, getEditMode } from '../constants/editModes';
import { haptic } from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeaturedBlockProps {
  editMode: EditMode;
  onPress: () => void;
  beforeImage?: ImageSourcePropType | string;
  afterImage?: ImageSourcePropType | string;
}

export const FeaturedBlock: React.FC<FeaturedBlockProps> = ({ 
  editMode, 
  onPress, 
  beforeImage, 
  afterImage 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const mode = getEditMode(editMode);
  const [fullscreenImage, setFullscreenImage] = useState<'before' | 'after' | null>(null);

  if (!mode) return null;

  const handlePress = () => {
    haptic.medium();
    onPress();
  };

  const handleImagePress = (type: 'before' | 'after', event: any) => {
    event.stopPropagation();
    haptic.light();
    setFullscreenImage(type);
  };

  const closeFullscreen = () => {
    haptic.light();
    setFullscreenImage(null);
  };

  // Convert string URIs to proper image source format
  const beforeSource = typeof beforeImage === 'string' 
    ? { uri: beforeImage } 
    : beforeImage;
  const afterSource = typeof afterImage === 'string' 
    ? { uri: afterImage } 
    : afterImage;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[theme.colors.primary + '20', theme.colors.primary + '10', theme.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header - Title and Featured Badge on same line */}
          <View style={styles.topHeaderRow}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                {mode.name}
              </Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                {mode.description}
              </Text>
            </View>
            
            {/* Featured Badge - Top Right */}
            <View style={[styles.featuredBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={[styles.featuredLabel, { color: theme.colors.primary }]}>
                ⭐ FEATURED
              </Text>
            </View>
          </View>

          {/* Preview Section - Before/After Visual Representation */}
          <View style={styles.beforeAfterRow}>
            {/* Before Image */}
            <View style={styles.comparisonBox}>
              <TouchableOpacity 
                onPress={(e) => handleImagePress('before', e)}
                activeOpacity={0.8}
                style={styles.imageTouchable}
              >
                {beforeSource ? (
                  <View style={styles.imageWrapper}>
                    <View style={styles.imageClipContainer}>
                      <Image 
                        source={beforeSource} 
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.expandIconContainer}>
                      <Ionicons name="expand-outline" size={16} color={theme.colors.text} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderIcon}>📷</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.labelText, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>Before</Text>
            </View>
            
            {/* Arrow/Divider */}
            <View style={styles.arrowDivider}>
              <Text style={[styles.arrow, { color: theme.colors.primary }]}>→</Text>
            </View>
            
            {/* After Image */}
            <View style={styles.comparisonBox}>
              <TouchableOpacity 
                onPress={(e) => handleImagePress('after', e)}
                activeOpacity={0.8}
                style={styles.imageTouchable}
              >
                {afterSource ? (
                  <View style={styles.imageWrapper}>
                    <View style={styles.imageClipContainer}>
                      <Image 
                        source={afterSource} 
                        style={styles.previewImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.expandIconContainer}>
                      <Ionicons name="expand-outline" size={16} color={theme.colors.text} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderIcon}>✨</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.labelText, { color: theme.colors.primary, marginTop: theme.spacing.xs }]}>After</Text>
            </View>
          </View>

          {/* CTA Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={`Try ${mode.name} Now`}
              onPress={handlePress}
              variant="primary"
              size="small"
              fullWidth
            />
          </View>
        </View>
      </LinearGradient>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={fullscreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFullscreen}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeFullscreen}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={closeFullscreen}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            {fullscreenImage === 'before' && beforeSource && (
              <Image 
                source={beforeSource} 
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
            {fullscreenImage === 'after' && afterSource && (
              <Image 
                source={afterSource} 
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: theme.spacing.base,
      marginTop: theme.spacing.base,
      marginBottom: theme.spacing.base,
      borderRadius: 12,
      overflow: 'hidden',
    },
    gradient: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
    },
    content: {
      paddingHorizontal: theme.spacing.base,
      paddingVertical: theme.spacing.sm,
    },
    topHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.base,
    },
    featuredBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
      alignSelf: 'flex-start',
    },
    featuredLabel: {
      fontSize: theme.typography.scaled.xs,
      fontWeight: theme.typography.weight.bold,
      letterSpacing: 0.5,
    },
    titleContainer: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.scaled.lg,
      fontWeight: theme.typography.weight.bold,
      marginBottom: 2,
    },
    description: {
      fontSize: theme.typography.scaled.sm,
    },
    beforeAfterRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.base,
    },
    comparisonBox: {
      flex: 1,
      alignItems: 'center',
    },
    imageTouchable: {
      width: '100%',
      height: 100,
    },
    imageWrapper: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    imageClipContainer: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.backgroundSecondary,
    },
    expandIconContainer: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      backgroundColor: theme.colors.surface + 'E0',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: theme.colors.border,
    },
    imagePlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface + '40',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    placeholderIcon: {
      fontSize: 32,
      opacity: 0.5,
    },
    labelText: {
      fontSize: theme.typography.scaled.sm,
      fontWeight: theme.typography.weight.semibold,
      textAlign: 'center',
    },
    arrowDivider: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
      paddingHorizontal: theme.spacing.xs,
    },
    arrow: {
      fontSize: 20,
      fontWeight: theme.typography.weight.bold,
    },
    buttonContainer: {
      marginTop: 0,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullscreenImage: {
      width: SCREEN_WIDTH * 0.95,
      height: SCREEN_HEIGHT * 0.8,
      maxWidth: SCREEN_WIDTH,
      maxHeight: SCREEN_HEIGHT * 0.9,
    },
  });
