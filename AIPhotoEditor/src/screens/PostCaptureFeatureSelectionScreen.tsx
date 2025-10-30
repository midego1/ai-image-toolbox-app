import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, Dimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { AIToolHeader } from '../components/AIToolHeader';
import { Card } from '../components/Card';
import { ZoomableImage } from '../components/ZoomableImage';
import { haptic } from '../utils/haptics';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, EDIT_MODES } from '../constants/editModes';
import { ImageProcessingService } from '../services/imageProcessingService';
import { SubscriptionService } from '../services/subscriptionService';

const { width, height } = Dimensions.get('window');

const PostCaptureFeatureSelectionScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const navigation = useNavigation<NavigationProp<'PostCaptureFeatureSelection'>>();
  const route = useRoute<RouteProp<'PostCaptureFeatureSelection'>>();
  const imageUri = route.params.imageUri;

  const [showImagePreview, setShowImagePreview] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  React.useEffect(() => {
    SubscriptionService.checkSubscriptionStatus().then(setIsPremium).catch(() => setIsPremium(false));
  }, []);

  const modes = useMemo(() => Object.values(EDIT_MODES).filter(Boolean), []);

  const handleFeatureSelected = (editMode: EditMode) => {
    // Route selection logic matches QuickCameraScreen
    const parentNav = navigation.getParent();
    if (editMode === EditMode.VIRTUAL_TRY_ON) {
      if (parentNav) {
        parentNav.navigate('VirtualTryOnSelection', { editMode, personImageUri: imageUri });
      } else {
        navigation.navigate('VirtualTryOnSelection', { editMode, personImageUri: imageUri } as any);
      }
    } else if (editMode === EditMode.TRANSFORM) {
      if (parentNav) {
        parentNav.navigate('GenreSelection', { imageUri, editMode });
      } else {
        navigation.navigate('GenreSelection', { imageUri, editMode } as any);
      }
    } else {
      if (parentNav) {
        parentNav.navigate('ImagePreview', { imageUri, editMode });
      } else {
        navigation.navigate('ImagePreview', { imageUri, editMode } as any);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['bottom']}>
      <AIToolHeader title="Select Feature" backgroundColor={colors.backgroundSecondary} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.md, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => { haptic.light(); setShowImagePreview(true); }}
            activeOpacity={0.9}
            style={{ alignSelf: 'center' }}
          >
            <View style={{
              width: width - (spacing.base * 2),
              aspectRatio: 4 / 3,
              maxHeight: Math.min(height * 0.6, 550),
              minHeight: 300,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              backgroundColor: colors.surface,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.12,
              shadowRadius: 20,
              elevation: 8,
            }}>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.base, alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, gap: spacing.xs }}>
                  <Ionicons name="expand" size={18} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: typography.scaled.sm, fontWeight: typography.weight.medium }}>Tap to view full size</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Feature list - connected cards */}
        <View style={{ paddingHorizontal: spacing.base, marginTop: spacing.lg }}>
          {modes.map((mode, index) => {
            const isLocked = (mode as any).isPremium && !isPremium;
            const isNotWorking = !ImageProcessingService.isModeSupported((mode as any).id);
            const isDisabled = isLocked || isNotWorking;
            return (
              <Card
                key={(mode as any).id}
                icon={(mode as any).icon}
                title={(mode as any).name}
                subtitle={(mode as any).description}
                showPremiumBadge={(mode as any).isPremium}
                rightIcon={isLocked ? 'lock' : 'chevron'}
                disabled={isDisabled}
                onPress={() => {
                  if (isDisabled) { haptic.error(); return; }
                  haptic.selection();
                  handleFeatureSelected((mode as any).id);
                }}
                isFirstInGroup={index === 0}
                isLastInGroup={index === modes.length - 1}
                showSeparator={index < modes.length - 1}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Fullscreen preview */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
        statusBarTranslucent
      >
        <ZoomableImage
          uri={imageUri}
          onClose={() => { haptic.light(); setShowImagePreview(false); }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});

export default PostCaptureFeatureSelectionScreen;


