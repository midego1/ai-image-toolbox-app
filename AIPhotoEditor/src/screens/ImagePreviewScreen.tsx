import React, { useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

const { width, height } = Dimensions.get('window');

const ImagePreviewScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<NavigationProp<'Processing'>>();
  const route = useRoute<RouteProp<'ImagePreview'>>();
  const { imageUri, editMode } = route.params;
  const [showImagePreview, setShowImagePreview] = useState(false);
  const modeData = getEditMode(editMode);

  const handleProcess = () => {
    haptic.medium();

    // Try to navigate using parent navigator first
    const parentNav = navigation.getParent();
    const navParams = {
      imageUri,
      editMode,
      config: {}
    };

    if (parentNav) {
      parentNav.navigate('Processing', navParams);
    } else {
      navigation.navigate('Processing', navParams);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <Header
        title={modeData?.name || 'Preview'}
        leftAction={{
          icon: 'chevron-back-outline',
          onPress: () => navigation.goBack(),
        }}
      />

      {/* Compact preview */}
      <View style={[styles.previewContainer, { paddingHorizontal: spacing.base, paddingVertical: spacing.base }]}>
        <TouchableOpacity
          onPress={() => {
            haptic.light();
            setShowImagePreview(true);
          }}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: imageUri }}
            style={[styles.preview, {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            }]}
          />
          <View style={[styles.expandIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="expand" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <Text style={[styles.previewTitle, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.bold }]}>
            Your Photo
          </Text>
          <Text style={[styles.previewSubtitle, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>
            Tap to view larger • Ready to process
          </Text>
        </View>
      </View>

      {/* Explanation for Remove Background */}
      {editMode === EditMode.REMOVE_BACKGROUND && (
        <View style={[styles.explanationContainer, { 
          backgroundColor: colors.surface, 
          marginHorizontal: spacing.base,
          marginTop: spacing.md,
          padding: spacing.base,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }]}>
          <View style={styles.explanationHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.explanationTitle, { 
              color: colors.text, 
              fontSize: typography.scaled.base, 
              fontWeight: typography.weight.bold,
              marginLeft: spacing.xs,
            }]}>
              How it works
            </Text>
          </View>
          <Text style={[styles.explanationText, { 
            color: colors.textSecondary, 
            fontSize: typography.scaled.sm,
            marginTop: spacing.xs,
            lineHeight: 20,
          }]}>
            Our AI will automatically detect and remove the background from your photo, keeping the main subject intact. The result will have a transparent background, perfect for use in other designs or compositions.
          </Text>
        </View>
      )}

      {/* Process Button */}
      <View style={[styles.buttonContainer, { paddingHorizontal: spacing.base, paddingBottom: spacing.xl }]}>
        <Button
          title={`Process ${modeData?.name || 'Image'}`}
          onPress={handleProcess}
          style={styles.processButton}
        />
      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <Pressable
          style={[styles.previewModal, { backgroundColor: 'rgba(0, 0, 0, 0.96)' }]}
          onPress={() => {
            haptic.light();
            setShowImagePreview(false);
          }}
        >
          <SafeAreaView style={styles.previewModalSafeArea} edges={['top', 'bottom']}>
            {/* Image - center of screen with elegant styling */}
            <View style={styles.imageContainer}>
              <View style={[styles.imageWrapper, { backgroundColor: colors.surface + '10' }]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.previewModalImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Elegant hint with gradient backdrop */}
            <View style={styles.hintContainer}>
              <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.4)']}
                style={styles.hintGradient}
              >
                <View style={[styles.hintBubble, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
                  <Ionicons name="hand-left-outline" size={18} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={[styles.previewModalHint, { color: 'rgba(255, 255, 255, 0.9)', fontSize: typography.scaled.base, fontWeight: typography.weight.medium }]}>
                    Tap anywhere to close
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
  },
  expandIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    // Dynamic
  },
  previewSubtitle: {
    marginTop: 2,
    // Dynamic
  },
  explanationContainer: {
    // Dynamic styles applied inline
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  explanationTitle: {
    // Dynamic styles applied inline
  },
  explanationText: {
    // Dynamic styles applied inline
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  processButton: {
    minWidth: '100%',
  },
  previewModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalSafeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageWrapper: {
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  previewModalImage: {
    width: width - 56,
    height: height * 0.65,
    borderRadius: 16,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintGradient: {
    width: '100%',
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  previewModalHint: {
    textAlign: 'center',
  },
});

export default ImagePreviewScreen;
