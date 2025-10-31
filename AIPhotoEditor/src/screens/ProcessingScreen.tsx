import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Image, Animated, Alert, TouchableOpacity, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ImageProcessingService } from '../services/imageProcessingService';
import { SubscriptionService } from '../services/subscriptionService';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { AnalyticsService } from '../services/analyticsService';
import { ProcessingHeader } from '../components/ProcessingHeader';
import { AnimatedProgressBar } from '../components/AnimatedProgressBar';
import { ProcessingStatusMessage } from '../components/ProcessingStatusMessage';
import { SuccessAnimation } from '../components/SuccessAnimation';
import {
  getProcessingStages,
  getCurrentStage,
  getEstimatedRemainingTime,
} from '../utils/processingStages';

const ProcessingScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const navigation = useNavigation<NavigationProp<'Result'>>();
  const route = useRoute<RouteProp<'Processing'>>();
  const { imageUri, editMode, config } = route.params;
  
  // State management
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing...');
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const backgroundBlurAnim = useState(new Animated.Value(0))[0];
  
  // Refs
  const editStartTsRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingStartTimeRef = useRef<number | null>(null);
  const currentStageIndexRef = useRef<number>(0);
  const transformedImageUriRef = useRef<string | null>(null);
  
  // Get edit mode data and processing stages
  const modeData = getEditMode(editMode);
  // Memoize processingStages to prevent infinite re-renders
  const processingStages = useMemo(() => getProcessingStages(editMode), [editMode]);
  const currentStage = getCurrentStage(processingStages, progress);

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
      Animated.timing(backgroundBlurAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false, // Blur doesn't support native driver
      }),
    ]).start();

    checkAndProcess();
    
    // Show cancel button after 3 seconds
    const cancelTimer = setTimeout(() => {
      setShowCancel(true);
    }, 3000);

    return () => {
      clearTimeout(cancelTimer);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Simulate progress updates based on stages
  useEffect(() => {
    if (!isProcessing || isComplete) return;

    // Clear any existing interval first
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    const updateProgress = () => {
      // If processing hasn't started yet, wait
      if (!processingStartTimeRef.current) {
        return;
      }

      const elapsed = (Date.now() - processingStartTimeRef.current) / 1000; // seconds
      
      // Apply a slowdown factor (0.75) to ensure progress bar is slower than actual processing
      // This prevents the progress bar from reaching 100% before processing completes
      const slowedElapsed = elapsed * 0.75;
      
      // Calculate total estimated time for all stages
      const totalEstimatedTime = processingStages.reduce(
        (sum, stage) => sum + stage.estimatedTimeSeconds,
        0
      );
      
      // Cap progress at 90% maximum until processing actually completes
      const maxProgressCap = 90;
      
      // Find current stage based on slowed elapsed time
      let cumulativeTime = 0;
      let stageFound = false;
      
      for (let i = 0; i < processingStages.length; i++) {
        const stage = processingStages[i];
        const stageDuration = stage.estimatedTimeSeconds;
        
        if (slowedElapsed <= cumulativeTime + stageDuration) {
          // We're in this stage
          const stageProgress = (slowedElapsed - cumulativeTime) / stageDuration;
          const stageProgressPercent = Math.min(stageProgress, 1);
          
          // Calculate progress within this stage
          const prevProgress = i > 0 ? processingStages[i - 1].progress : 0;
          const stageRange = stage.progress - prevProgress;
          const currentProgress = prevProgress + (stageRange * stageProgressPercent);
          
          // Apply the max cap and ensure we don't exceed it
          const cappedProgress = Math.min(currentProgress, stage.progress, maxProgressCap);
          setProgress(cappedProgress);
          setStatus(stage.message);
          setEstimatedTime(getEstimatedRemainingTime(processingStages, cappedProgress));
          currentStageIndexRef.current = i;
          stageFound = true;
          break;
        }
        
        cumulativeTime += stageDuration;
      }
      
      // If we've passed all stages, cap at maxProgressCap until processing completes
      if (!stageFound && processingStages.length > 0) {
        const cappedProgress = maxProgressCap;
        setProgress(cappedProgress);
        setStatus('Almost done...');
        // Estimate remaining time based on how long we've been waiting
        // Use a conservative estimate
        const timeOverEstimated = elapsed - totalEstimatedTime;
        const estimatedRemaining = Math.max(2, 10 - timeOverEstimated);
        setEstimatedTime(Math.min(estimatedRemaining, 10));
      }
    };

    // Update progress every 200ms for smooth animation
    progressIntervalRef.current = setInterval(updateProgress, 200);
    // Initial update after a short delay to ensure processingStartTimeRef is set
    setTimeout(updateProgress, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isProcessing, isComplete, processingStages]);

  const checkAndProcess = async () => {
    try {
      // local analytics: edit started
      try { 
        await AnalyticsService.increment('edit_started'); 
        await AnalyticsService.incrementByMode(String(editMode), 'edit_started');
      } catch {}
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

      // Initialize progress with first stage
      processingStartTimeRef.current = Date.now();
      setProgress(processingStages[0].progress);
      setStatus(processingStages[0].message);
      setEstimatedTime(getEstimatedRemainingTime(processingStages, processingStages[0].progress));

      // Process image
      await processImage();
    } catch (error: any) {
      haptic.error();
      navigation.goBack();
    }
  };

  const processImage = async () => {
    try {
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
        
        // Stop progress simulation
        setIsProcessing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        // Complete progress and show success animation
        setProgress(100);
        setStatus('Complete!');
        setEstimatedTime(0);
        setIsComplete(true);
        haptic.success();
        
        // local analytics: edit completed + duration
        try {
          await AnalyticsService.increment('edit_completed');
          await AnalyticsService.incrementByMode(String(editMode), 'edit_completed');
          if (editStartTsRef.current) {
            await AnalyticsService.addDurationMs(Date.now() - editStartTsRef.current);
          }
        } catch {}
        
        // Consume credit after successful processing
        const creditCost = modeData?.creditCost ?? 1;
        await SubscriptionService.consumeCredit(creditCost);
        
        const transformedUri = result.imageUri;
        transformedImageUriRef.current = transformedUri;
        
        console.log('[ProcessingScreen] About to navigate to Result screen with params:', {
          hasOriginalImage: !!imageUri,
          hasTransformedImage: !!transformedUri,
          editMode,
          hasConfig: !!config,
          configKeys: config ? Object.keys(config) : [],
        });
      } else {
        haptic.error();
        const errorMessage = result.error || 'Unknown error occurred';
        console.error('[ProcessingScreen] Processing failed:', errorMessage);
        try { await AnalyticsService.increment('errors'); } catch {}
        setIsProcessing(false);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
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

  const handleSuccessComplete = () => {
    // Navigate to result screen after success animation
    const transformedUri = transformedImageUriRef.current;
    if (!transformedUri) {
      console.error('[ProcessingScreen] No transformed image URI available');
      navigation.goBack();
      return;
    }

    try {
      navigation.replace('Result', {
        originalImage: imageUri,
        transformedImage: transformedUri,
        editMode,
        config: config,
        createdAt: Date.now(),
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
  };

  const handleCancel = () => {
    haptic.light();
    Alert.alert(
      'Cancel Processing?',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue Processing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            setIsProcessing(false);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            navigation.goBack();
          },
        },
      ]
    );
  };


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={{ uri: imageUri }} style={styles.backgroundImage} />
      <Animated.View style={[styles.blurOverlay, { opacity: backgroundBlurAnim }]}>
        <BlurView intensity={45} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.92)', 'rgba(0, 0, 0, 0.85)', 'rgba(0, 0, 0, 0.92)']}
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
        {isComplete ? (
          <SuccessAnimation onComplete={handleSuccessComplete} />
        ) : (
          <View style={[styles.processingCard, {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 16,
            padding: spacing.lg,
            width: '90%',
            maxWidth: 400,
          }]}>
            <ProcessingHeader modeData={modeData} />
            
            <ProcessingStatusMessage
              message={status}
              estimatedTime={estimatedTime}
            />
            
            <View style={styles.progressWrapper}>
              <AnimatedProgressBar
                progress={progress}
                currentStage={currentStage?.index !== undefined ? currentStage.index + 1 : undefined}
                totalStages={processingStages.length}
                showStages={processingStages.length > 1}
              />
            </View>

            {showCancel && isProcessing && (
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.cancelButton, { marginTop: spacing.xl }]}
              >
                <Text
                  style={[
                    styles.cancelText,
                    { 
                      color: colors.textSecondary,
                      textShadowColor: 'rgba(0, 0, 0, 0.8)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
    opacity: 0.3,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  progressWrapper: {
    width: '85%',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  processingCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default ProcessingScreen;
