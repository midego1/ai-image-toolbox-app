import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, ActivityIndicator, Animated } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageProcessingService } from '../services/imageProcessingService';
import { SubscriptionService } from '../services/subscriptionService';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';

const ProcessingScreen = () => {
  const { theme } = useTheme();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<NavigationProp<'Result'>>();
  const route = useRoute<RouteProp<'Processing'>>();
  const { imageUri, editMode, config } = route.params;
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing...');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  
  const modeData = getEditMode(editMode);

  useEffect(() => {
    // Animate entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    checkAndProcess();
  }, []);

  const checkAndProcess = async () => {
    try {
      // Check if user can transform
      const canTransform = await SubscriptionService.canTransform();
      if (!canTransform) {
        haptic.error();
        navigation.goBack();
        return;
      }

      setStatus('Processing with AI...');
      setProgress(20);

      // Process image
      await processImage();
    } catch (error: any) {
      haptic.error();
      navigation.goBack();
    }
  };

  const processImage = async () => {
    try {
      setProgress(30);
      setStatus(`Processing ${modeData?.name || 'image'}...`);

      const result = await ImageProcessingService.processImage(
        imageUri,
        editMode,
        config
      );
      
      if (result.success && result.imageUri) {
        setProgress(100);
        setStatus('Complete!');
        haptic.success();
        
        // Increment transformation count
        await SubscriptionService.incrementTransformations();
        
        const transformedUri = result.imageUri;
        
        // Small delay for better UX
        setTimeout(() => {
          navigation.replace('Result', {
            originalImage: imageUri,
            transformedImage: transformedUri,
            editMode,
          });
        }, 500);
      } else {
        haptic.error();
        navigation.goBack();
      }
    } catch (error: any) {
      haptic.error();
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={{ uri: imageUri }} style={styles.backgroundImage} />
      <LinearGradient
        colors={[colors.overlayDark, 'transparent', colors.overlayDark]}
        style={styles.gradient}
      />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            padding: spacing.xl,
          },
        ]}
      >
        <Text style={[styles.genreName, { color: colors.primary, fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, marginBottom: spacing.xl }]}>{modeData?.name || 'Processing'}</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: spacing.xl }} />
        <Text style={[styles.processingText, { color: colors.text, fontSize: typography.scaled.lg, fontWeight: typography.weight.semibold, marginBottom: spacing.xl }]}>{status}</Text>
        <View style={[styles.progressContainer, { width: '80%', marginBottom: spacing.base }]}>
          <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.subText, { color: colors.textSecondary, fontSize: typography.scaled.sm }]}>This may take up to 30 seconds</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genreName: {
    // Dynamic styles applied inline
  },
  processingText: {
    // Dynamic styles applied inline
  },
  progressContainer: {
    // Dynamic styles applied inline
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  subText: {
    textAlign: 'center',
    // Dynamic styles applied inline
  },
});

export default ProcessingScreen;
