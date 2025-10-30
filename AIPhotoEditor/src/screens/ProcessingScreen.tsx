import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Text, ActivityIndicator, Animated, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageProcessingService } from '../services/imageProcessingService';
import { SubscriptionService } from '../services/subscriptionService';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { AnalyticsService } from '../services/analyticsService';

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
  const editStartTsRef = useRef<number | null>(null);
  
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
      // local analytics: edit started
      try { await AnalyticsService.increment('edit_started'); } catch {}
      editStartTsRef.current = Date.now();
      // Get edit mode data to check subscription and credit requirements
      const requiresSubscription = modeData?.requiresSubscription ?? false;
      const creditCost = modeData?.creditCost ?? 1;

      // Check if user can use this feature
      const accessCheck = await SubscriptionService.canUseFeature(requiresSubscription, creditCost);
      
      if (!accessCheck.canUse) {
        haptic.error();
        Alert.alert(
          accessCheck.reason?.includes('subscription') ? 'Subscription Required' : 'Insufficient Credits',
          accessCheck.reason || 'You need a subscription or more credits to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'View Plans', 
              onPress: () => {
                navigation.goBack();
                // Navigate to subscription screen
                setTimeout(() => {
                  navigation.navigate('Subscription' as any);
                }, 100);
              }
            }
          ]
        );
        navigation.goBack();
        return;
      }

      // Set appropriate status message based on edit mode
      if (editMode === EditMode.PROFESSIONAL_HEADSHOTS) {
        setStatus('Creating professional headshot...');
      } else {
        setStatus('Processing with AI...');
      }
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
      if (editMode === EditMode.PROFESSIONAL_HEADSHOTS) {
        setStatus('Enhancing face, applying background, and adjusting lighting...');
      } else {
        setStatus(`Processing ${modeData?.name || 'image'}...`);
      }

      console.log('[ProcessingScreen] Calling ImageProcessingService.processImage...');
      const result = await ImageProcessingService.processImage(
        imageUri,
        editMode,
        config
      );
      
      console.log('[ProcessingScreen] ImageProcessingService returned:', {
        success: result.success,
        hasImageUri: !!result.imageUri,
        error: result.error
      });
      
      if (result.success && result.imageUri) {
        console.log('[ProcessingScreen] Processing succeeded! Navigating to Result screen...');
        setProgress(100);
        setStatus('Complete!');
        haptic.success();
        // local analytics: edit completed + duration
        try {
          await AnalyticsService.increment('edit_completed');
          if (editStartTsRef.current) {
            await AnalyticsService.addDurationMs(Date.now() - editStartTsRef.current);
          }
        } catch {}
        
        // Consume credit after successful processing
        const creditCost = modeData?.creditCost ?? 1;
        await SubscriptionService.consumeCredit(creditCost);
        
        // Get remaining credits for success message
        const remaining = await SubscriptionService.getCreditsRemaining();
        const creditText = creditCost === 0.1 
          ? '0.1 credit' 
          : `${creditCost} credit${creditCost !== 1 ? 's' : ''}`;
        
        const transformedUri = result.imageUri;
        
        console.log('[ProcessingScreen] About to navigate to Result screen with params:', {
          hasOriginalImage: !!imageUri,
          hasTransformedImage: !!transformedUri,
          editMode,
          hasConfig: !!config,
          configKeys: config ? Object.keys(config) : [],
        });
        
        // Small delay for better UX
        setTimeout(() => {
          try {
            navigation.replace('Result', {
              originalImage: imageUri,
              transformedImage: transformedUri,
              editMode,
              config: config, // Pass config to Result screen for virtual try-on clothing items
            });
            console.log('[ProcessingScreen] Navigation to Result screen completed');
          } catch (navError: any) {
            console.error('[ProcessingScreen] Navigation error:', navError);
            Alert.alert(
              'Navigation Error',
              'Failed to navigate to result screen. Please try again.',
              [
                { 
                  text: 'OK', 
                  onPress: () => navigation.goBack() 
                }
              ]
            );
          }
        }, 500);
      } else {
        haptic.error();
        const errorMessage = result.error || 'Unknown error occurred';
        console.error('[ProcessingScreen] Processing failed:', errorMessage);
        try { await AnalyticsService.increment('errors'); } catch {}
        Alert.alert(
          'Processing Failed',
          errorMessage,
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      }
    } catch (error: any) {
      haptic.error();
      console.error('[ProcessingScreen] Unexpected error:', error);
      try { await AnalyticsService.increment('errors'); } catch {}
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred during processing.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
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
