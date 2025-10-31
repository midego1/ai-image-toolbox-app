import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Modal, ScrollView, Pressable, Dimensions, Image } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, EDIT_MODES } from '../constants/editModes';
import { FlashMode, CameraLens } from '../types/camera';
import { IconButton } from '../components/IconButton';
import { Card } from '../components/Card';
import { ZoomableImage } from '../components/ZoomableImage';
import { Button } from '../components/Button';
import { useTheme, spacing as fallbackSpacing } from '../theme';
import { haptic } from '../utils/haptics';
import { useScreenFlash } from '../utils/screenFlash';
import { getNextFlashMode, getFlashIconName, shouldUseFlash, shouldUseScreenFlash, mapLensIdentifier, lensToIdentifier } from '../utils/flashMode';
import { SettingsService } from '../services/settingsService';
import { SubscriptionService } from '../services/subscriptionService';
import { ImageProcessingService } from '../services/imageProcessingService';

const QuickCameraScreen = () => {
  const { theme } = useTheme();
  const colors = theme?.colors || {} as any;
  // Always use fallback spacing to ensure it's available - theme.spacing should be the same object
  const spacing = fallbackSpacing;
  const navigation = useNavigation<NavigationProp<'GenreSelection' | 'Processing' | 'ImagePreview'>>();
  const insets = useSafeAreaInsets();
  // Get route params if available (only when navigated from stack with editMode, not as tab)
  const route = useRoute();
  const editModeFromRoute = (route.params as any)?.editMode as EditMode | undefined;
  const preselectedGenreId = (route.params as any)?.preselectedGenreId as string | undefined;
  const onPhotoCallback = (route.params as any)?.onPhoto as ((uri: string) => void) | undefined;
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [selectedLens, setSelectedLens] = useState<CameraLens>('standard');
  const [availableLenses, setAvailableLenses] = useState<CameraLens[]>(['standard']);
  const [availableLensIdentifiers, setAvailableLensIdentifiers] = useState<Record<CameraLens, string>>({
    'standard': 'builtInWideAngleCamera',
    'ultra-wide': 'builtInUltraWideCamera',
    'telephoto': 'builtInTelephotoCamera',
  });
  // CRITICAL: Always keep zoomLevel at 0 to ensure NO digital zoom is ever used
  // We only use native optical zoom via selectedLens prop
  // Note: zoomLevel state is kept for consistency, but CameraView zoom prop is hardcoded to 0
  const [zoomLevel, setZoomLevel] = useState(0);
  const [selectedZoom, setSelectedZoom] = useState<number>(1);
  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);
  const [showFeatureSelector, setShowFeatureSelector] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const { triggerFlash, FlashOverlay } = useScreenFlash({
    flashDuration: 150,
  });

  // Get latest photo for thumbnail
  useEffect(() => {
    const getLatestPhoto = async () => {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const assets = await MediaLibrary.getAssetsAsync({
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: MediaLibrary.SortBy.creationTime,
            first: 1,
          });
          if (assets.assets.length > 0) {
            // Convert ph:// URL to file:// using ImageManipulator
            try {
              const manipulated = await ImageManipulator.manipulateAsync(
                assets.assets[0].uri,
                [],
                { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
              );
              setLatestPhoto(manipulated.uri);
            } catch (err) {
              console.warn('Could not process thumbnail:', err);
              setLatestPhoto(assets.assets[0].uri);
            }
          }
        }
      } catch (error) {
        console.warn('Could not get latest photo:', error);
      }
    };
    getLatestPhoto();
  }, []);

  // Load subscription status
  useEffect(() => {
    const load = async () => {
      try {
        const premium = await SubscriptionService.checkSubscriptionStatus();
        setIsPremium(premium);
      } catch (e) {
        setIsPremium(false);
      }
    };
    load();
  }, []);

  // Detect available camera lenses
  useEffect(() => {
    const checkAvailableLenses = async () => {
      try {
        if (cameraRef.current) {
          try {
            if (typeof cameraRef.current.getAvailableLenses === 'function') {
              const lensIds = await cameraRef.current.getAvailableLenses();
              console.log('[QuickCamera] Available lens IDs:', lensIds);
              
              let mappedLenses: CameraLens[] = [];
              const identifiers: Record<CameraLens, string> = { ...availableLensIdentifiers };
              
              for (const lensId of lensIds) {
                const mapped = mapLensIdentifier(lensId);
                console.log(`[QuickCamera] Mapping lens "${lensId}" to: ${mapped}`);
                if (mapped && !mappedLenses.includes(mapped)) {
                  mappedLenses.push(mapped);
                  identifiers[mapped] = lensId;
                }
              }
              
              // Restrict to ultra-wide and standard only (no telephoto)
              mappedLenses = mappedLenses.filter(l => l === 'standard' || l === 'ultra-wide');

              if (!mappedLenses.includes('standard')) {
                mappedLenses.unshift('standard');
              }
              
              console.log('[QuickCamera] Mapped lenses:', mappedLenses);
              if (mappedLenses.length > 0) {
                setAvailableLenses(mappedLenses);
                setAvailableLensIdentifiers(identifiers);
                if (!mappedLenses.includes(selectedLens)) {
                  setSelectedLens('standard');
                }
              }
            }
          } catch (err) {
            console.log('[QuickCamera] getAvailableLenses not available, will use callback:', err);
          }
        }
      } catch (error) {
        console.warn('[QuickCamera] Could not detect available lenses:', error);
        setAvailableLenses(['standard']);
        setSelectedLens('standard');
      }
    };
    
    const timer1 = setTimeout(checkAvailableLenses, 500);
    const timer2 = setTimeout(checkAvailableLenses, 2000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
    }, [facing]);
  
  // Ensure zoomLevel stays at 0 whenever facing or selectedLens changes
  useEffect(() => {
    // Enforce native zoom only - reset to 0 if it ever becomes non-zero
    if (zoomLevel !== 0) {
      console.warn('[QuickCamera] zoomLevel should always be 0 for native zoom only. Resetting.');
      setZoomLevel(0);
    }
  }, [facing, selectedLens, zoomLevel]);

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.permissionContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.permissionIcon, { fontSize: 64, marginBottom: spacing.base }]}>📷</Text>
        <Text style={[styles.permissionText, { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: spacing.sm }]}>
          Camera Permission Required
        </Text>
        <Text style={[styles.permissionSubtext, { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.xl }]}>
          We need access to your camera to take photos.
        </Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          style={{ minWidth: 200 }}
        />
      </SafeAreaView>
    );
  }

  const handleImageSelected = (imageUri: string, editMode?: EditMode) => {
    const modeToUse = editMode || editModeFromRoute || EditMode.TRANSFORM;
    if (modeToUse === EditMode.VIRTUAL_TRY_ON) {
      // Virtual try-on goes to VirtualTryOnSelection with person image pre-filled
      navigation.navigate('VirtualTryOnSelection', { editMode: modeToUse, personImageUri: imageUri } as any);
    } else if (modeToUse === EditMode.TRANSFORM) {
      // If launched locally from Features stack with a callback, return result in-place
      if (typeof onPhotoCallback === 'function') {
        try { onPhotoCallback(imageUri); } catch {}
        navigation.goBack();
        return;
      }
      // Otherwise, navigate to GenreSelection as before
      (navigation as any).navigate('GenreSelection', { imageUri, editMode: modeToUse, preselectedGenreId } as any);
    } else if (modeToUse === EditMode.REMOVE_BACKGROUND) {
      // If launched locally from Features stack with a callback, return result in-place
      if (typeof onPhotoCallback === 'function') {
        try { onPhotoCallback(imageUri); } catch {}
        navigation.goBack();
        return;
      }
      // Otherwise, navigate back to RemoveBackgroundScreen with the captured image
      (navigation as any).navigate('RemoveBackground', { imageUri } as any);
    } else if (modeToUse === EditMode.REPLACE_BACKGROUND) {
      // If launched locally from Features stack with a callback, return result in-place
      if (typeof onPhotoCallback === 'function') {
        try { onPhotoCallback(imageUri); } catch {}
        navigation.goBack();
        return;
      }
      // Otherwise, navigate to ReplaceBackgroundScreen
      (navigation as any).navigate('ReplaceBackground', { imageUri } as any);
    } else if (modeToUse === EditMode.REMOVE_OBJECT) {
      // If launched locally from Features stack with a callback, return result in-place
      if (typeof onPhotoCallback === 'function') {
        try { onPhotoCallback(imageUri); } catch {}
        navigation.goBack();
        return;
      }
      // Otherwise, navigate to RemoveObjectScreen
      (navigation as any).navigate('RemoveObject', { imageUri } as any);
    } else if (modeToUse === EditMode.PROFESSIONAL_HEADSHOTS) {
      // If launched locally from Features stack with a callback, return result in-place
      if (typeof onPhotoCallback === 'function') {
        try { onPhotoCallback(imageUri); } catch {}
        navigation.goBack();
        return;
      }
      // Otherwise, navigate to ProfessionalHeadshotsScreen
      (navigation as any).navigate('ProfessionalHeadshots', { imageUri } as any);
    } else if (modeToUse === EditMode.PIXEL_ART_GAMER) {
      // If launched locally from Features stack with a callback, return result in-place
      if (typeof onPhotoCallback === 'function') {
        try { onPhotoCallback(imageUri); } catch {}
        navigation.goBack();
        return;
      }
      // Otherwise, navigate to PixelArtGamerScreen
      (navigation as any).navigate('PixelArtGamer', { imageUri } as any);
    } else {
      // Other AI tools go to ImagePreview screen
      navigation.navigate('ImagePreview', { imageUri, editMode: modeToUse } as any);
    }
  };

  const handleFeatureSelected = (editMode: EditMode) => {
    setShowFeatureSelector(false);

    if (!capturedImageUri) return;

    handleImageSelected(capturedImageUri, editMode);
    setCapturedImageUri(null);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        haptic.medium();
        
        let flashPromise: Promise<void> | null = null;
        const useScreenFlashNow = shouldUseScreenFlash(flashMode, facing);
        
        if (useScreenFlashNow) {
          flashPromise = triggerFlash();
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (flashPromise) {
          await flashPromise;
        }
        
        if (photo?.uri) {
          // Auto-save original photo if enabled
          const shouldAutoSave = await SettingsService.getAutoSaveOriginals();
          if (shouldAutoSave) {
            try {
              const permission = await MediaLibrary.requestPermissionsAsync();
              if (permission.granted) {
                // Save the original photo before manipulation
                await MediaLibrary.saveToLibraryAsync(photo.uri);
                console.log('[QuickCamera] Auto-saved original photo');
              }
            } catch (saveError) {
              // Don't block the flow if auto-save fails
              console.warn('[QuickCamera] Failed to auto-save original photo:', saveError);
            }
          }

          const manipulatedImage = await ImageManipulator.manipulateAsync(
            photo.uri,
            [],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          
          haptic.success();
          
          // If editMode provided via route, go directly to processing/genre selection
          // Otherwise show feature selector modal
          if (editModeFromRoute) {
            handleImageSelected(manipulatedImage.uri);
          } else {
            navigation.navigate('PostCaptureFeatureSelection' as any, { imageUri: manipulatedImage.uri } as any);
          }
        }
      } catch (error) {
        haptic.error();
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const toggleFlashMode = () => {
    haptic.selection();
    setFlashMode(getNextFlashMode(flashMode));
  };

  const toggleLens = () => {
    haptic.selection();
    const currentIndex = availableLenses.indexOf(selectedLens);
    const nextIndex = (currentIndex + 1) % availableLenses.length;
    const nextLens = availableLenses[nextIndex];
    console.log(`[QuickCamera] Switching lens from ${selectedLens} to ${nextLens}`);
    setSelectedLens(nextLens);
    setSelectedZoom(1);
    // Ensure zoomLevel stays at 0 for native optical zoom only
    setZoomLevel(0);
  };

  const handleZoomPress = (zoom: number) => {
    haptic.selection();
    setSelectedZoom(zoom);
    
    // Use native physical lenses only - NO digital zoom
    // When using selectedLens, zoom should always be 0 to use pure optical zoom
    if (zoom === 0.5 && availableLenses.includes('ultra-wide')) {
      setSelectedLens('ultra-wide');
      setZoomLevel(0); // Native lens - no digital zoom
    } else if (zoom === 1) {
      setSelectedLens('standard');
      setZoomLevel(0); // Native lens - no digital zoom
    }
  };

  const copyImageToFileSystem = async (uri: string): Promise<string> => {
    if (uri.startsWith('file://')) {
      return uri;
    }

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      return manipulated.uri;
    } catch (error) {
      console.error('Error processing image URI:', error);
      throw error;
    }
  };

  const openLatestPhoto = async () => {
    await pickFromGallery();
  };

  const pickFromGallery = async () => {
    try {
      haptic.light();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        haptic.success();
        const fileUri = await copyImageToFileSystem(result.assets[0].uri);
        
        // If editMode provided via route, go directly to processing/genre selection
        // Otherwise show feature selector modal
        if (editModeFromRoute) {
          handleImageSelected(fileUri);
        } else {
          navigation.navigate('PostCaptureFeatureSelection' as any, { imageUri: fileUri } as any);
        }
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      haptic.error();
      Alert.alert('Error', 'Failed to select image from gallery');
    }
  };

  const flashIcon = getFlashIconName(flashMode);
  const isFlashActive = flashMode === 'on' || (flashMode === 'auto' && facing === 'back');

  const handleFocus = (event: any) => {
    if (!cameraRef.current) return;
    
    try {
      const { locationX, locationY } = event.nativeEvent;
      const { width, height } = Dimensions.get('window');
      
      const normalizedX = locationX / width;
      const normalizedY = locationY / height;
      
      if (typeof cameraRef.current.focus === 'function') {
        cameraRef.current.focus({ x: normalizedX, y: normalizedY });
        haptic.light();
      } else if (typeof cameraRef.current.setFocusAsync === 'function') {
        cameraRef.current.setFocusAsync(normalizedX, normalizedY);
        haptic.light();
      }

    } catch (error) {
      console.debug('[QuickCamera] Focus not available:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CameraView 
          style={styles.camera} 
          facing={facing} 
          ref={cameraRef}
          zoom={0}
          flash={(facing === 'front' ? 'off' : (flashMode === 'on' ? 'on' : (flashMode === 'auto' ? 'auto' : 'off'))) as any}
          selectedLens={availableLensIdentifiers[selectedLens] || undefined}
          // CRITICAL: zoom prop is ALWAYS 0 (hardcoded) to ensure NO digital zoom is ever used
          // We only use native optical zoom via selectedLens prop (switching physical camera lenses)
          // The zoom prop is for digital zoom (cropping), which degrades image quality
          onMountError={(error) => {
            console.error('[QuickCamera] Camera mount error:', error);
            Alert.alert('Camera Error', error.message || 'Failed to initialize camera');
          }}
          onAvailableLensesChanged={(event) => {
            const lensIds = event.lenses || [];
            console.log('[QuickCamera] onAvailableLensesChanged event:', lensIds, 'facing:', facing);
            let mappedLenses: CameraLens[] = [];
            const identifiers: Record<CameraLens, string> = { ...availableLensIdentifiers };
            
            for (const lensId of lensIds) {
              const mapped = mapLensIdentifier(lensId);
              if (mapped && !mappedLenses.includes(mapped)) {
                mappedLenses.push(mapped);
                identifiers[mapped] = lensId;
              }
            }
            
            // Restrict to ultra-wide and standard only (no telephoto)
            mappedLenses = mappedLenses.filter(l => l === 'standard' || l === 'ultra-wide');

            if (!mappedLenses.includes('standard')) {
              mappedLenses.unshift('standard');
              const standardId = lensIds.find(id => {
                const idLower = id.toLowerCase();
                return mapLensIdentifier(id) === 'standard' || 
                       idLower.includes('camera') && !idLower.includes('ultra') && !idLower.includes('telephoto') ||
                       idLower === 'front' || idLower === 'back';
              }) || (facing === 'front' ? 'front' : 'builtInWideAngleCamera');
              identifiers['standard'] = standardId;
            }
            
            if (mappedLenses.length > 0) {
              console.log('[QuickCamera] Updated available lenses from callback:', mappedLenses, 'for', facing, 'camera');
              setAvailableLenses(mappedLenses);
              setAvailableLensIdentifiers(identifiers);
              if (!mappedLenses.includes(selectedLens)) {
                setSelectedLens('standard');
              }
            }
          }}
        >
        <Pressable 
          style={StyleSheet.absoluteFill}
          onPress={handleFocus}
        >
          <SafeAreaView style={styles.overlay} edges={['top']}>
          {/* Top Bar */}
          <View style={[styles.topBar, { padding: spacing.base, paddingTop: spacing.md }]} pointerEvents="box-none">
            {/* Left: Back Button (only if editMode from route - i.e., navigated from feature) */}
            <View style={styles.topBarLeft}>
              {editModeFromRoute ? (
                <IconButton
                  name="chevron-back"
                  onPress={() => navigation.goBack()}
                  size={26}
                  color="#FFFFFF"
                  backgroundColor="rgba(0, 0, 0, 0.5)"
                  style={styles.cameraControl}
                />
              ) : (
                <View style={{ width: 44, height: 44 }} />
              )}
            </View>
            
            {/* Right: Flash Button */}
            <View style={styles.topBarRight}>
              <IconButton
                name={flashIcon}
                onPress={toggleFlashMode}
                size={26}
                color={isFlashActive ? "#FFD700" : "#FFFFFF"}
                backgroundColor="rgba(0, 0, 0, 0.5)"
                style={styles.cameraControl}
              />
            </View>
          </View>

          {/* Focus indicator removed (no visual feedback) */}

          {/* Bottom Bar */}
          <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom + 8, 24) }]}>
            {/* Zoom Buttons Above Shutter */}
            {availableLenses.length >= 1 && (
              <View style={styles.zoomContainerWrapper}>
                <View style={styles.zoomContainer}>
                {(() => {
                  const zoomOptions: number[] = [];
                  if (availableLenses.includes('ultra-wide')) zoomOptions.push(0.5);
                  zoomOptions.push(1);
                  return zoomOptions.map((zoom) => {
                    const isActive = selectedZoom === zoom;
                    return (
                      <TouchableOpacity
                        key={zoom}
                        style={[
                          styles.zoomButton,
                          {
                            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                          }
                        ]}
                        onPress={() => handleZoomPress(zoom)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.zoomButtonText,
                          { color: isActive ? '#FFD700' : '#FFFFFF' }
                        ]}>
                          {zoom}x
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
                </View>
              </View>
            )}

            <View style={styles.bottomBar}>
              {/* Bottom Left: Library Button */}
              <View style={styles.bottomBarLeft}>
                <TouchableOpacity
                  style={styles.latestPhotoContainer}
                  onPress={openLatestPhoto}
                  activeOpacity={0.7}
                >
                  {latestPhoto ? (
                    <Image source={{ uri: latestPhoto }} style={styles.latestPhoto} />
                  ) : (
                    <View style={[styles.latestPhotoPlaceholder, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
                      <IconButton
                        name="images"
                        onPress={openLatestPhoto}
                        size={20}
                        color="#FFFFFF"
                        backgroundColor="transparent"
                        style={{ margin: 0 }}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Center: Shutter Button - perfectly centered on screen */}
              <View style={styles.bottomBarCenter}>
                <TouchableOpacity
                  style={[styles.captureButton, {
                    backgroundColor: colors.text,
                    borderColor: colors.background,
                    shadowColor: colors.shadow,
                  }]}
                  onPress={takePicture}
                  activeOpacity={0.8}
                >
                  <View style={[styles.captureButtonInner, { backgroundColor: colors.text }]} />
                </TouchableOpacity>
              </View>

              {/* Bottom Right: Switch Camera */}
              <View style={styles.bottomBarRight}>
                <IconButton
                  name="camera-reverse"
                  onPress={() => {
                    haptic.selection();
                    setFacing(current => {
                      const newFacing = current === 'back' ? 'front' : 'back';
                      // Reset zoom to 0 when switching cameras to ensure native zoom only
                      setZoomLevel(0);
                      return newFacing;
                    });
                  }}
                  size={26}
                  color="#FFFFFF"
                  backgroundColor="rgba(0, 0, 0, 0.5)"
                  style={styles.cameraControl}
                />
              </View>
            </View>
          </View>
          </SafeAreaView>
        </Pressable>
        
        <FlashOverlay />
      </CameraView>

      {/* Feature Selection Modal */}
      <Modal
        visible={showFeatureSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowFeatureSelector(false);
          setCapturedImageUri(null);
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }] }>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Feature</Text>
              <TouchableOpacity onPress={() => {
                setShowFeatureSelector(false);
                setCapturedImageUri(null);
              }}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {capturedImageUri && (
                <View style={{ paddingHorizontal: 16, paddingTop: 12, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setShowImagePreview(true);
                    }}
                    activeOpacity={0.9}
                    style={{ alignSelf: 'center' }}
                  >
                    <View style={{
                      width: Dimensions.get('window').width - 32,
                      aspectRatio: 4 / 3,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: 'hidden',
                      backgroundColor: colors.surface,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.12,
                      shadowRadius: 16,
                      elevation: 6,
                    }}>
                      <Image
                        source={{ uri: capturedImageUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {(() => {
                const modes = Object.values(EDIT_MODES).filter(Boolean);
                return modes.map((mode, index) => {
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
                        if (isDisabled) {
                          haptic.error();
                          return;
                        }
                        haptic.selection();
                        handleFeatureSelected((mode as any).id);
                      }}
                      isFirstInGroup={index === 0}
                      isLastInGroup={index === modes.length - 1}
                      showSeparator={index < modes.length - 1}
                    />
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Fullscreen Image Preview from chooser */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
        statusBarTranslucent
      >
        {capturedImageUri ? (
          <ZoomableImage
            uri={capturedImageUri}
            onClose={() => {
              haptic.light();
              setShowImagePreview(false);
            }}
          />
        ) : (
          <View />
        )}
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  topBarLeft: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarRight: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cameraControl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSection: {
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  zoomContainerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 16,
  },
  zoomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  zoomButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    minWidth: 50,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
  },
  zoomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
    position: 'relative',
  },
  bottomBarLeft: {
    position: 'absolute',
    left: 24, // spacing.xl
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBarCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBarRight: {
    position: 'absolute',
    right: 24, // spacing.xl
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  latestPhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  latestPhoto: {
    width: '100%',
    height: '100%',
  },
  latestPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionIcon: {
    // Dynamic
  },
  permissionText: {
    textAlign: 'center',
  },
  permissionSubtext: {
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  featureOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  featureModalIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureModalInfo: {
    flex: 1,
  },
  featureModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureModalDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Focus indicator style removed
});

export default QuickCameraScreen;
