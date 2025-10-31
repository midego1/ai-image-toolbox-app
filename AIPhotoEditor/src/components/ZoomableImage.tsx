import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  GestureResponderEvent,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ZoomableImageProps {
  uri: string;
  onClose: () => void;
  watermark?: React.ReactNode;
  onSave?: () => void;
  onShare?: () => void;
  isSaving?: boolean;
  hasSaved?: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  uri,
  onClose,
  watermark,
  onSave,
  onShare,
  isSaving = false,
  hasSaved = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const doubleTapRef = useRef<number | null>(null);
  const doubleTapDetected = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pinchRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialCenterX: number;
    initialCenterY: number;
  } | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, []);

  const getImageDimensions = () => {
    if (imageSize.width === 0 || imageSize.height === 0) {
      return { width: SCREEN_WIDTH * 0.95, height: SCREEN_HEIGHT * 0.75 };
    }

    const imageAspect = imageSize.width / imageSize.height;
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    
    // Use more screen space for better viewing
    const containerWidth = SCREEN_WIDTH * 0.95;
    const containerHeight = SCREEN_HEIGHT * 0.75;

    let displayWidth: number;
    let displayHeight: number;

    // Fit image to container while maintaining aspect ratio
    if (imageAspect > containerWidth / containerHeight) {
      // Image is wider than container aspect ratio
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspect;
    } else {
      // Image is taller than container aspect ratio
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspect;
    }

    // Ensure minimum size for very small images
    if (displayWidth < SCREEN_WIDTH * 0.3) {
      displayWidth = SCREEN_WIDTH * 0.3;
      displayHeight = displayWidth / imageAspect;
    }

    return { width: displayWidth, height: displayHeight };
  };

  const calculateBounds = () => {
    const { width: displayWidth, height: displayHeight } = getImageDimensions();
    const currentScale = lastScale.current;
    const scaledWidth = displayWidth * currentScale;
    const scaledHeight = displayHeight * currentScale;

    // Calculate bounds more accurately
    // Only allow translation if scaled image is larger than screen
    const maxTranslateX = scaledWidth > SCREEN_WIDTH 
      ? (scaledWidth - SCREEN_WIDTH) / 2 
      : 0;
    const maxTranslateY = scaledHeight > SCREEN_HEIGHT 
      ? (scaledHeight - SCREEN_HEIGHT) / 2 
      : 0;

    return {
      minX: -maxTranslateX,
      maxX: maxTranslateX,
      minY: -maxTranslateY,
      maxY: maxTranslateY,
      scaledWidth,
      scaledHeight,
    };
  };

  const panStartRef = useRef({ x: 0, y: 0, time: 0 });
  const panStartTranslate = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Always capture gestures when not zoomed (for tap-to-close or swipe)
        // When zoomed, capture for panning
        return true;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // If moved significantly, it's a pan/swipe gesture
        // Use a smaller threshold to detect movement earlier
        if (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3) {
          isPanningRef.current = true;
          return true;
        }
        return false;
      },
      onPanResponderGrant: (evt) => {
        panStartRef.current = {
          x: evt.nativeEvent.pageX,
          y: evt.nativeEvent.pageY,
          time: Date.now(),
        };
        // Store initial translation position for this gesture
        panStartTranslate.current = {
          x: lastTranslateX.current,
          y: lastTranslateY.current,
        };
        isPanningRef.current = false;
        
        // Cancel any pending close timeout when a new gesture starts
        // This prevents accidental closes during double-tap sequences
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        
        // Extract offset to make current value the base for new gestures
        translateX.setOffset(lastTranslateX.current);
        translateY.setOffset(lastTranslateY.current);
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        isPanningRef.current = true;

        if (lastScale.current > MIN_SCALE) {
          // Pan when zoomed - use offset-based approach for smoother dragging
          const bounds = calculateBounds();
          
          // Calculate new position relative to gesture start (gestureState.dx/dy is cumulative)
          let newX = panStartTranslate.current.x + gestureState.dx;
          let newY = panStartTranslate.current.y + gestureState.dy;

          // Constrain to bounds with proper clamping
          // Only constrain if the scaled image is actually larger than the screen
          if (bounds.scaledWidth > SCREEN_WIDTH) {
            newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
          } else {
            // If image fits in screen, center it
            newX = 0;
          }
          
          if (bounds.scaledHeight > SCREEN_HEIGHT) {
            newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
          } else {
            // If image fits in screen, center it
            newY = 0;
          }

          // Set absolute position (after flattenOffset, value represents total translation)
          translateX.setValue(newX);
          translateY.setValue(newY);

          // Update refs to track current position
          lastTranslateX.current = newX;
          lastTranslateY.current = newY;
        } else {
          // Swipe down to dismiss - be more responsive
          if (gestureState.dy > 0) {
            const dragProgress = Math.min(1, gestureState.dy / 250);
            translateY.setValue(gestureState.dy);
            opacity.setValue(1 - dragProgress * 0.8);
          } else if (gestureState.dy < -10) {
            // Prevent upward drag when not zoomed
            translateY.setValue(0);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        translateY.flattenOffset();

        // Calculate final position relative to gesture start
        const finalX = lastScale.current > MIN_SCALE 
          ? panStartTranslate.current.x + gestureState.dx 
          : 0;
        const finalY = lastScale.current > MIN_SCALE 
          ? panStartTranslate.current.y + gestureState.dy 
          : gestureState.dy;
        const totalDistance = Math.sqrt(
          Math.pow(gestureState.dx, 2) + Math.pow(gestureState.dy, 2)
        );
        const timeDiff = Date.now() - panStartRef.current.time;
        const wasPanning = isPanningRef.current;

        // Reset panning flag
        isPanningRef.current = false;

        // Handle tap-to-close when not zoomed and not panned
        if (
          lastScale.current <= MIN_SCALE &&
          !wasPanning &&
          totalDistance < 10 &&
          timeDiff < 300
        ) {
          // Check if this is part of a double tap
          const now = Date.now();
          
          // If a double tap was already detected by handleTouchStart, don't process this tap
          if (doubleTapDetected.current) {
            // Don't reset immediately - let handleTouchStart manage it
            return;
          }
          
          // Check if we're within a double-tap window - if so, this might be a double tap
          if (doubleTapRef.current && now - doubleTapRef.current < 400) {
            // This is likely a double tap, cancel any pending close timeout immediately
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
            // Mark that a double tap is in progress - handleTouchStart will handle the zoom
            doubleTapDetected.current = true;
            // Don't clear doubleTapRef yet - let handleTouchStart clear it
            return;
          }
          
          // This appears to be a single tap, but wait to see if a second tap comes
          // Cancel any existing close timeout first
          if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
          }
          
          // Set up double tap detection window with longer timeout to prevent race conditions
          doubleTapRef.current = now;
          doubleTapDetected.current = false;
          closeTimeoutRef.current = setTimeout(() => {
            // Only close if no second tap occurred (i.e., it was a single tap)
            // Double check that doubleTapDetected wasn't set during the timeout
            if (!doubleTapDetected.current && doubleTapRef.current === now) {
              doubleTapRef.current = null;
              closeTimeoutRef.current = null;
              onClose();
            } else {
              doubleTapRef.current = null;
              doubleTapDetected.current = false;
              closeTimeoutRef.current = null;
            }
          }, 400); // Increased timeout to 400ms for better double-tap detection
          return;
        }

        // Handle swipe down to dismiss (more sensitive threshold)
        if (lastScale.current <= MIN_SCALE && gestureState.dy > 100 && gestureState.dy > Math.abs(gestureState.dx) * 1.5) {
          // Dismiss on swipe down - lower threshold for better UX
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
            // Reset values
            scale.setValue(1);
            translateX.setValue(0);
            translateY.setValue(0);
            opacity.setValue(1);
            lastScale.current = 1;
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          });
          return;
        }

        // Reset opacity and position if not dismissing
        if (lastScale.current <= MIN_SCALE) {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
          ]).start(() => {
            lastTranslateX.current = 0;
            lastTranslateY.current = 0;
          });
        }

        // Constrain to bounds when zoomed - use smoother spring for snap-back
        if (lastScale.current > MIN_SCALE) {
          const bounds = calculateBounds();
          
          // Only constrain if image is larger than screen
          let constrainedX = finalX;
          let constrainedY = finalY;
          
          if (bounds.scaledWidth > SCREEN_WIDTH) {
            constrainedX = Math.max(bounds.minX, Math.min(bounds.maxX, finalX));
          } else {
            constrainedX = 0;
          }
          
          if (bounds.scaledHeight > SCREEN_HEIGHT) {
            constrainedY = Math.max(bounds.minY, Math.min(bounds.maxY, finalY));
          } else {
            constrainedY = 0;
          }

          // Update refs immediately
          lastTranslateX.current = constrainedX;
          lastTranslateY.current = constrainedY;

          if (Math.abs(constrainedX - finalX) > 0.5 || Math.abs(constrainedY - finalY) > 0.5) {
            // Smooth snap-back to bounds with optimized spring animation
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: constrainedX,
                useNativeDriver: true,
                tension: 80,
                friction: 9,
              }),
              Animated.spring(translateY, {
                toValue: constrainedY,
                useNativeDriver: true,
                tension: 80,
                friction: 9,
              }),
            ]).start(() => {
              // Ensure refs are in sync after animation
              lastTranslateX.current = constrainedX;
              lastTranslateY.current = constrainedY;
            });
          }
        } else {
          // Reset to center when not zoomed
          lastTranslateX.current = 0;
          lastTranslateY.current = 0;
        }
      },
    })
  ).current;

  const handlePinch = (evt: GestureResponderEvent) => {
    const touches = evt.nativeEvent.touches;
    if (touches.length !== 2) {
      if (touches.length === 0) {
        pinchRef.current = null;
      }
      return;
    }

    const touch1 = touches[0];
    const touch2 = touches[1];
    const distance = Math.sqrt(
      Math.pow(touch2.pageX - touch1.pageX, 2) +
      Math.pow(touch2.pageY - touch1.pageY, 2)
    );
    const centerX = (touch1.pageX + touch2.pageX) / 2;
    const centerY = (touch1.pageY + touch2.pageY) / 2;

    if (!pinchRef.current) {
      pinchRef.current = {
        initialDistance: distance,
        initialScale: lastScale.current,
        initialCenterX: centerX,
        initialCenterY: centerY,
      };
      return;
    }

    const scaleFactor = distance / pinchRef.current.initialDistance;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, pinchRef.current.initialScale * scaleFactor)
    );

    // Calculate zoom center point relative to screen
    const screenCenterX = SCREEN_WIDTH / 2;
    const screenCenterY = SCREEN_HEIGHT / 2;
    
    // Get current image dimensions
    const { width: displayWidth, height: displayHeight } = getImageDimensions();
    
    // Calculate the focal point (where user is pinching) relative to image center
    // Image is centered at screen center + current translation
    const imageCenterX = screenCenterX + lastTranslateX.current;
    const imageCenterY = screenCenterY + lastTranslateY.current;
    
    // Calculate distance from focal point to image center in image coordinates
    const focalOffsetX = centerX - imageCenterX;
    const focalOffsetY = centerY - imageCenterY;
    
    // When scaling, maintain the focal point under the pinch center
    const scaleRatio = newScale / lastScale.current;
    
    // Calculate new translation to keep focal point fixed during zoom
    // Formula: newTranslate = oldTranslate - (focalOffset * (newScale/oldScale - 1))
    const newTranslateX = lastTranslateX.current - (focalOffsetX * (scaleRatio - 1));
    const newTranslateY = lastTranslateY.current - (focalOffsetY * (scaleRatio - 1));
    
    // Calculate bounds with the new scale
    const scaledWidth = displayWidth * newScale;
    const scaledHeight = displayHeight * newScale;
    
    // Calculate max translation for new scale
    const maxTranslateX = scaledWidth > SCREEN_WIDTH 
      ? (scaledWidth - SCREEN_WIDTH) / 2 
      : 0;
    const maxTranslateY = scaledHeight > SCREEN_HEIGHT 
      ? (scaledHeight - SCREEN_HEIGHT) / 2 
      : 0;
    
    // Constrain the new translation to bounds
    let constrainedX = newTranslateX;
    let constrainedY = newTranslateY;
    
    if (scaledWidth > SCREEN_WIDTH) {
      constrainedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
    } else {
      constrainedX = 0;
    }
    
    if (scaledHeight > SCREEN_HEIGHT) {
      constrainedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
    } else {
      constrainedY = 0;
    }

    // Apply transforms immediately for smooth zoom
    scale.setValue(newScale);
    translateX.setValue(constrainedX);
    translateY.setValue(constrainedY);

    // Update refs with constrained values
    lastScale.current = newScale;
    lastTranslateX.current = constrainedX;
    lastTranslateY.current = constrainedY;
  };

  const handleDoubleTap = () => {
    const targetScale = lastScale.current > MIN_SCALE ? MIN_SCALE : 2.5;
    const targetX = targetScale === MIN_SCALE ? 0 : lastTranslateX.current;
    const targetY = targetScale === MIN_SCALE ? 0 : lastTranslateY.current;

    // Use smoother spring animations with optimized parameters
    Animated.parallel([
      Animated.spring(scale, {
        toValue: targetScale,
        useNativeDriver: true,
        tension: 100,
        friction: 7.5,
      }),
      Animated.spring(translateX, {
        toValue: targetX,
        useNativeDriver: true,
        tension: 100,
        friction: 7.5,
      }),
      Animated.spring(translateY, {
        toValue: targetY,
        useNativeDriver: true,
        tension: 100,
        friction: 7.5,
      }),
    ]).start(() => {
      lastScale.current = targetScale;
      lastTranslateX.current = targetX;
      lastTranslateY.current = targetY;
    });
  };

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageSize({ width, height });
  };

  const handleTouchStart = () => {
    const now = Date.now();
    if (doubleTapRef.current && now - doubleTapRef.current < 400) {
      // Second tap detected - double tap zoom
      // Cancel any pending close timeout immediately
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      // Mark double tap as detected BEFORE handling it
      doubleTapDetected.current = true;
      // Perform the zoom
      handleDoubleTap();
      // Clear the ref after a short delay to allow onPanResponderRelease to see the flag
      setTimeout(() => {
        doubleTapRef.current = null;
        doubleTapDetected.current = false;
      }, 100);
    } else {
      // First tap - set up detection window
      doubleTapRef.current = now;
      doubleTapDetected.current = false;
      setTimeout(() => {
        if (doubleTapRef.current === now && !doubleTapDetected.current) {
          doubleTapRef.current = null;
        }
      }, 400); // Match the timeout in onPanResponderRelease
    }
  };

  const animatedStyle = {
    transform: [
      { scale },
      { translateX },
      { translateY },
    ] as any,
    opacity,
  };

  const { width: displayWidth, height: displayHeight } = getImageDimensions();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.imageContainer,
          {
            width: displayWidth,
            height: displayHeight,
          },
          animatedStyle,
        ]}
        onTouchStart={handleTouchStart}
        onTouchMove={handlePinch}
        onTouchEnd={() => {
          pinchRef.current = null;
        }}
      >
        <Image
          source={{ uri }}
          style={[styles.image, { width: displayWidth, height: displayHeight }]}
          resizeMode="contain"
          onLoad={handleImageLoad}
          // Improve performance for large images
          resizeMethod="resize"
        />
        {watermark && <View style={styles.watermarkContainer}>{watermark}</View>}
      </Animated.View>

      <View style={[styles.hintContainer, { bottom: insets.bottom + 12 }]}>
        <View style={styles.hintBubble}>
          {/* Save Button */}
          {onSave && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  haptic.light();
                  onSave();
                }}
                disabled={isSaving || hasSaved}
                activeOpacity={0.7}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.9)" />
                ) : (
                  <Ionicons
                    name={hasSaved ? 'checkmark-circle' : 'download-outline'}
                    size={18}
                    color={hasSaved ? '#4CAF50' : 'rgba(255, 255, 255, 0.9)'}
                  />
                )}
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}

          {/* Hint Text */}
          <Text style={styles.hintText}>Pinch to zoom • Double tap to zoom • Swipe down to close</Text>

          {/* Share Button */}
          {onShare && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  haptic.light();
                  onShare();
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="share-outline"
                  size={18}
                  color="rgba(255, 255, 255, 0.9)"
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  hintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  actionButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
