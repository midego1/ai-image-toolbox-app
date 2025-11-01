import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ImageSourcePropType,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ZoomableImageProps {
  // Thumbnail mode props
  source?: ImageSourcePropType | { uri: string };
  thumbnailStyle?: any;
  thumbnailResizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  children?: React.ReactNode; // To wrap custom thumbnail content

  // Direct fullscreen mode props (for use inside Modal)
  uri?: string;
  onClose?: () => void;
  watermark?: React.ReactNode;
  onSave?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  hasSaved?: boolean;
}

/**
 * ZoomableImage - A versatile component that supports two modes:
 *
 * 1. Thumbnail mode: Displays a thumbnail image that opens to fullscreen when tapped
 *    Use props: source, thumbnailStyle, children
 *
 * 2. Direct fullscreen mode: Renders the zoomable viewer directly (for use inside Modal)
 *    Use props: uri, onClose, watermark, onSave, onShare, isSaving, hasSaved
 *
 * Both modes support:
 * - Double-tap to zoom in/out
 * - Pinch-to-zoom
 * - Swipe down to close
 *
 * @example Thumbnail mode
 * <ZoomableImage
 *   source={require('./image.jpg')}
 *   thumbnailStyle={{ width: 200, height: 200, borderRadius: 12 }}
 * />
 *
 * @example Direct fullscreen mode
 * <Modal visible={true}>
 *   <ZoomableImage
 *     uri="https://example.com/image.jpg"
 *     onClose={() => setVisible(false)}
 *     watermark={<Text>Watermark</Text>}
 *   />
 * </Modal>
 */
export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  source,
  thumbnailStyle,
  thumbnailResizeMode = 'cover',
  children,
  uri,
  onClose,
  watermark,
  onSave,
  onShare,
  isSaving,
  hasSaved,
}) => {
  const { theme } = useTheme();
  const { colors } = theme;
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT
  });

  // Determine which mode we're in
  const isDirectMode = !!uri && !!onClose;

  // Load image dimensions to calculate proper display size
  useEffect(() => {
    const loadImageSize = () => {
      // Handle both local (require) and remote ({uri: ...}) images
      let imageSource: any;

      if (uri) {
        imageSource = uri;
      } else if (typeof source === 'number') {
        // Local image from require() - use Image.resolveAssetSource
        const resolvedSource = Image.resolveAssetSource(source);
        if (resolvedSource) {
          setImageDimensions({ width: resolvedSource.width, height: resolvedSource.height });
          return;
        }
      } else if ((source as any)?.uri) {
        imageSource = (source as any).uri;
      }

      if (!imageSource) {
        // Fallback if we can't determine source
        setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
        return;
      }

      Image.getSize(
        imageSource,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        (error) => {
          console.error('Error loading image size:', error);
          // Fallback to screen dimensions
          setImageDimensions({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
        }
      );
    };

    if (isDirectMode || modalVisible) {
      loadImageSize();
    }
  }, [uri, source, isDirectMode, modalVisible]);

  // Calculate image display dimensions that fit within screen (accounting for safe area)
  const getImageDisplaySize = () => {
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    const aspectRatio = imgWidth / imgHeight;
    
    // Account for safe area insets
    const availableWidth = SCREEN_WIDTH;
    const availableHeight = SCREEN_HEIGHT - insets.top - insets.bottom;
    const availableAspectRatio = availableWidth / availableHeight;

    let displayWidth: number;
    let displayHeight: number;

    if (aspectRatio > availableAspectRatio) {
      // Image is wider than available space - fit to width
      displayWidth = availableWidth;
      displayHeight = availableWidth / aspectRatio;
    } else {
      // Image is taller than available space - fit to height
      displayHeight = availableHeight;
      displayWidth = availableHeight * aspectRatio;
    }

    // Ensure we don't exceed screen bounds
    return { 
      width: Math.min(displayWidth, availableWidth), 
      height: Math.min(displayHeight, availableHeight) 
    };
  };

  // Animation values for zoom and pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const openModal = () => {
    resetZoom();
    setModalVisible(true);
  };

  const closeModal = () => {
    if (onClose) {
      onClose();
    } else {
      setModalVisible(false);
    }
    resetZoom();
  };

  const resetZoom = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Double tap gesture to zoom in/out
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        // Zoom out
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom in to 2x
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Constrain zoom between 1x and 4x
      if (scale.value < 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > 4) {
        scale.value = withSpring(4);
        savedScale.value = 4;
      } else {
        savedScale.value = scale.value;
      }
    });

  // Pan gesture for moving zoomed image and swipe-down to close
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        // Allow panning when zoomed
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      } else {
        // When not zoomed, only allow vertical pan (swipe down to close)
        translateY.value = event.translationY > 0 ? event.translationY : 0;
      }
    })
    .onEnd((event) => {
      if (scale.value > 1) {
        // Save pan position when zoomed
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Swipe down to close gesture
        if (event.translationY > 100) {
          // Close modal if swiped down more than 100px
          runOnJS(closeModal)();
        } else {
          // Spring back to original position
          translateY.value = withSpring(0);
        }
      }
    });

  // Compose gestures
  const composedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Determine the image source for fullscreen view
  const imageSource = uri ? { uri } : source;

  // Shared fullscreen viewer component
  const FullscreenViewer = () => {
    const displaySize = getImageDisplaySize();
    
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.overlayDark }]}
            onPress={closeModal}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>

          {/* Zoomable Image Container */}
          <View style={styles.imageContainer}>
            <GestureDetector gesture={composedGesture}>
              <Animated.View style={[styles.animatedImageWrapper, animatedStyle]}>
                <Image
                  source={imageSource!}
                  style={[styles.fullImage, { 
                    width: displaySize.width, 
                    height: displaySize.height,
                  }]}
                  resizeMode="contain"
                />
                {watermark}
              </Animated.View>
            </GestureDetector>
          </View>

        {/* Action buttons for direct mode */}
        {isDirectMode && (onSave || onShare) && (
          <View style={[styles.actionsContainer, { backgroundColor: colors.overlayDark }]}>
            {onSave && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: hasSaved ? colors.success : colors.primary }]}
                onPress={onSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={hasSaved ? "checkmark" : "download-outline"}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={onShare}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Zoom Hint */}
        {!isDirectMode && (
          <View style={[styles.hintContainer, { backgroundColor: colors.overlayDark }]}>
            <Ionicons name="expand-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
            <Ionicons name="contract-outline" size={20} color={colors.text} />
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
    );
  };

  // Direct mode: Render fullscreen viewer directly (already inside a Modal)
  if (isDirectMode) {
    return <FullscreenViewer />;
  }

  // Thumbnail mode: Render thumbnail with modal
  return (
    <>
      {/* Thumbnail - Tap to open */}
      <TouchableOpacity
        onPress={openModal}
        activeOpacity={0.9}
        style={{ width: '100%', height: '100%' }}
      >
        {children || (
          <Image
            source={source!}
            style={[styles.thumbnail, thumbnailStyle]}
            resizeMode={thumbnailResizeMode}
          />
        )}
      </TouchableOpacity>

      {/* Full-screen Modal with Zoom */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <FullscreenViewer />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  thumbnail: {
    width: '100%',
    height: 200,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animatedImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullImage: {
    // Dimensions will be calculated dynamically based on image aspect ratio
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    opacity: 0.8,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
