import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ZoomableImageProps {
  uri: string;
  onClose: () => void;
  watermark?: React.ReactNode;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export const ZoomableImage: React.FC<ZoomableImageProps> = ({
  uri,
  onClose,
  watermark,
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
  const pinchRef = useRef<{
    initialDistance: number;
    initialScale: number;
    initialCenterX: number;
    initialCenterY: number;
  } | null>(null);

  const getImageDimensions = () => {
    if (imageSize.width === 0 || imageSize.height === 0) {
      return { width: SCREEN_WIDTH * 0.9, height: SCREEN_HEIGHT * 0.7 };
    }

    const imageAspect = imageSize.width / imageSize.height;
    const screenAspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    const containerWidth = SCREEN_WIDTH * 0.9;
    const containerHeight = SCREEN_HEIGHT * 0.7;

    let displayWidth: number;
    let displayHeight: number;

    if (imageAspect > containerWidth / containerHeight) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspect;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspect;
    }

    return { width: displayWidth, height: displayHeight };
  };

  const calculateBounds = () => {
    const { width: displayWidth, height: displayHeight } = getImageDimensions();
    const currentScale = lastScale.current;
    const scaledWidth = displayWidth * currentScale;
    const scaledHeight = displayHeight * currentScale;

    const maxTranslateX = Math.max(0, (scaledWidth - SCREEN_WIDTH) / 2);
    const maxTranslateY = Math.max(0, (scaledHeight - SCREEN_HEIGHT) / 2);

    return {
      minX: -maxTranslateX,
      maxX: maxTranslateX,
      minY: -maxTranslateY,
      maxY: maxTranslateY,
    };
  };

  const panStartRef = useRef({ x: 0, y: 0, time: 0 });
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
        isPanningRef.current = false;
        // Use extractOffset for smoother gesture handling
        translateX.setOffset(lastTranslateX.current);
        translateY.setOffset(lastTranslateY.current);
        translateX.extractOffset();
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        isPanningRef.current = true;

        if (lastScale.current > MIN_SCALE) {
          // Pan when zoomed - use offset-based approach for smoother dragging
          const bounds = calculateBounds();
          
          // Calculate new position with offset included
          const newX = lastTranslateX.current + gestureState.dx;
          const newY = lastTranslateY.current + gestureState.dy;

          // Constrain to bounds
          const constrainedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
          const constrainedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));

          // Set value directly for immediate response during drag
          translateX.setValue(constrainedX - lastTranslateX.current);
          translateY.setValue(constrainedY - lastTranslateY.current);
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

        const finalX = lastTranslateX.current + gestureState.dx;
        const finalY = lastTranslateX.current + gestureState.dy;
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
          if (doubleTapRef.current && now - doubleTapRef.current < 300) {
            // This is a double tap, let the double tap handler deal with it
            // Don't close on double tap
            return;
          }
          
          // Set up double tap detection window
          doubleTapRef.current = now;
          doubleTapDetected.current = false;
          setTimeout(() => {
            // Only close if no second tap occurred (i.e., it was a single tap)
            if (!doubleTapDetected.current && doubleTapRef.current === now) {
              doubleTapRef.current = null;
              onClose();
            } else {
              doubleTapRef.current = null;
              doubleTapDetected.current = false;
            }
          }, 300);
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
          const constrainedX = Math.max(bounds.minX, Math.min(bounds.maxX, finalX));
          const constrainedY = Math.max(bounds.minY, Math.min(bounds.maxY, finalY));

          // Update refs immediately
          lastTranslateX.current = constrainedX;
          lastTranslateY.current = constrainedY;

          if (constrainedX !== finalX || constrainedY !== finalY) {
            // Smooth snap-back to bounds with less friction for smoother feel
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: constrainedX,
                useNativeDriver: true,
                tension: 65,
                friction: 8,
              }),
              Animated.spring(translateY, {
                toValue: constrainedY,
                useNativeDriver: true,
                tension: 65,
                friction: 8,
              }),
            ]).start();
          }
        } else {
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
    
    // Calculate the focal point (where user is pinching) relative to image center
    const imageCenterX = screenCenterX + lastTranslateX.current;
    const imageCenterY = screenCenterY + lastTranslateY.current;
    
    // Calculate distance from focal point to image center
    const focalOffsetX = centerX - imageCenterX;
    const focalOffsetY = centerY - imageCenterY;
    
    // When scaling, the focal point should stay under the pinch center
    const scaleRatio = newScale / lastScale.current;
    const newFocalOffsetX = focalOffsetX * scaleRatio;
    const newFocalOffsetY = focalOffsetY * scaleRatio;
    
    // Calculate new translation to keep focal point under finger
    const newTranslateX = lastTranslateX.current - (newFocalOffsetX - focalOffsetX);
    const newTranslateY = lastTranslateY.current - (newFocalOffsetY - focalOffsetY);

    // Apply transforms immediately for smooth zoom
    scale.setValue(newScale);
    translateX.setValue(newTranslateX);
    translateY.setValue(newTranslateY);

    // Update refs
    lastScale.current = newScale;
    lastTranslateX.current = newTranslateX;
    lastTranslateY.current = newTranslateY;
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
    if (doubleTapRef.current && now - doubleTapRef.current < 300) {
      // Second tap detected - double tap zoom
      doubleTapDetected.current = true;
      handleDoubleTap();
      doubleTapRef.current = null;
    } else {
      doubleTapRef.current = now;
      doubleTapDetected.current = false;
      setTimeout(() => {
        if (doubleTapRef.current === now && !doubleTapDetected.current) {
          doubleTapRef.current = null;
        }
      }, 300);
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
        />
        {watermark && <View style={styles.watermarkContainer}>{watermark}</View>}
      </Animated.View>

      <View style={styles.hintContainer}>
        <View style={styles.hintBubble}>
          <Text style={styles.hintText}>Pinch to zoom • Double tap to zoom in/out • Swipe down to close</Text>
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
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
