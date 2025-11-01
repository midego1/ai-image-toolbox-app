import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Image, Animated, Alert, TouchableOpacity, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ImageProcessingService } from '../services/imageProcessingService';
import { SubscriptionService } from '../services/subscriptionService';
import { NavigationProp, RouteProp } from '../types/navigation';
import { EditMode, getEditMode } from '../constants/editModes';
import { WorkflowStepResult } from '../types/workflow';
import { useTheme } from '../theme';
import { haptic } from '../utils/haptics';
import { AnalyticsService } from '../services/analyticsService';
import { ProcessingHeader } from '../components/ProcessingHeader';
import { AnimatedProgressBar } from '../components/AnimatedProgressBar';
import { ProcessingStatusMessage } from '../components/ProcessingStatusMessage';
import { SuccessAnimation } from '../components/SuccessAnimation';
import { CompactStatsBar } from '../components/CompactStatsBar';
import { OptionsUsed } from '../components/OptionsUsed';
import { getOptionsSchema } from '../components/optionsSchemas';
import {
  getProcessingStages,
  getCurrentStage,
  getEstimatedRemainingTime,
  getAverageProcessingTime,
} from '../utils/processingStages';
import { formatCreditCost } from '../utils/creditCost';

const ProcessingScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const navigation = useNavigation<NavigationProp<'Result'>>();
  const route = useRoute<RouteProp<'Processing'>>();
  const { imageUri, editMode, config, workflow } = route.params;

  // Generate unique creation ID for tracking (if not provided)
  const creationId = route.params.creationId || `creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // State management
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing...');
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // Workflow state
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(route.params.workflowStepIndex || 0);
  const [workflowStepResults, setWorkflowStepResults] = useState<WorkflowStepResult[]>([]);
  
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
      // Check if this is a workflow with multiple steps
      if (workflow && workflow.steps && workflow.steps.length > 1) {
        console.log('[ProcessingScreen] Processing workflow with', workflow.steps.length, 'steps');
        await processWorkflow();
        return;
      }

      // Single-step processing (original logic)
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
        // Calculate dynamic credit cost for ENHANCE mode based on config
        let creditCost = modeData?.creditCost ?? 1;
        if (editMode === EditMode.ENHANCE && config) {
          // Base cost: 0.3 credits
          // 4x upscale adds 0.1 credits (0.4 total)
          // Face enhancement adds 0.2 credits
          creditCost = 0.3;
          if (config.outscale === 4) {
            creditCost += 0.1; // 0.4 for 4x
          }
          if (config.faceEnhance === true) {
            creditCost += 0.2; // Additional for face enhancement
          }
        }
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

  const processWorkflow = async () => {
    if (!workflow) return;

    try {
      const steps = workflow.steps;
      let currentImageUri = imageUri;
      const allStepResults: WorkflowStepResult[] = [...workflowStepResults];

      // Process from current step to end
      for (let i = currentWorkflowStep; i < steps.length; i++) {
        const step = steps[i];
        setCurrentWorkflowStep(i);

        // Update status to show current step
        const stepMessage = `Step ${i + 1}/${steps.length}: ${step.displayName}`;
        setStatus(stepMessage);
        setProgress(Math.floor((i / steps.length) * 90)); // Cap at 90% until complete

        console.log(`[ProcessingScreen] Processing workflow step ${i + 1}/${steps.length}: ${step.displayName}`);

        const stepStartTime = Date.now();

        // Process this step
        const result = await ImageProcessingService.processImage(
          currentImageUri,
          step.editMode,
          step.config
        );

        const stepProcessingTime = Date.now() - stepStartTime;

        if (!result.success || !result.imageUri) {
          const errorMsg = `Step "${step.displayName}" failed: ${result.error || 'Unknown error'}`;
          console.error('[ProcessingScreen]', errorMsg);

          setIsProcessing(false);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }

          // Show error with option to retry or save partial results
          Alert.alert(
            'Workflow Step Failed',
            errorMsg + '\n\nWould you like to retry or save results from completed steps?',
            [
              {
                text: 'Retry Step',
                onPress: () => {
                  setIsProcessing(true);
                  setCurrentWorkflowStep(i);
                  processWorkflow();
                }
              },
              {
                text: 'Save Partial Results',
                onPress: () => {
                  if (allStepResults.length > 0) {
                    const lastResult = allStepResults[allStepResults.length - 1];
                    navigateToResult(lastResult.imageUri, allStepResults);
                  } else {
                    navigation.goBack();
                  }
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => navigation.goBack()
              }
            ]
          );
          return;
        }

        // Store intermediate result
        const stepResult: WorkflowStepResult = {
          stepId: step.id,
          imageUri: result.imageUri,
          editMode: step.editMode,
          success: true,
          processingTimeMs: stepProcessingTime
        };

        allStepResults.push(stepResult);
        setWorkflowStepResults(allStepResults);
        currentImageUri = result.imageUri;

        console.log(`[ProcessingScreen] Workflow step ${i + 1} completed successfully`);
      }

      // All steps complete!
      console.log('[ProcessingScreen] All workflow steps completed successfully!');

      // Stop progress simulation
      setIsProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Complete progress and show success animation
      setProgress(100);
      setStatus('Workflow Complete!');
      setEstimatedTime(0);
      setIsComplete(true);
      haptic.success();

      // Analytics
      try {
        await AnalyticsService.increment('edit_completed');
        if (editStartTsRef.current) {
          await AnalyticsService.addDurationMs(Date.now() - editStartTsRef.current);
        }
      } catch {}

      // Store final image URI for navigation
      transformedImageUriRef.current = currentImageUri;

    } catch (error: any) {
      console.error('[ProcessingScreen] Workflow error:', error);
      setIsProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      Alert.alert(
        'Workflow Error',
        error.message || 'An unexpected error occurred during workflow processing.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const navigateToResult = (finalImageUri: string, stepResults: WorkflowStepResult[]) => {
    navigation.replace('Result', {
      originalImage: imageUri,
      transformedImage: finalImageUri,
      editMode: workflow ? workflow.steps[workflow.steps.length - 1].editMode : editMode,
      config,
      createdAt: Date.now(),
      creationId,
      workflowResults: stepResults.length > 0 ? stepResults : undefined
    });
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
      // Use navigateToResult helper which handles both single and workflow results
      navigateToResult(transformedUri, workflowStepResults);
      console.log('[ProcessingScreen] Navigation to Result screen completed with creationId:', creationId);
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
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      </Animated.View>
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
        {isComplete ? (
          <SuccessAnimation onComplete={handleSuccessComplete} />
        ) : (
          <View style={[styles.processingCard, {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            borderRadius: 16,
            padding: spacing.lg,
            width: '90%',
            maxWidth: 400,
          }]}>
            <ProcessingHeader
              modeData={modeData}
              progress={progress}
            />

            {/* Workflow Step Indicator */}
            {workflow && workflow.steps.length > 1 && (
              <View style={[styles.workflowSteps, { marginTop: spacing.md }]}>
                <Text style={[styles.workflowStepText, { color: colors.text, fontSize: typography.size.sm, textAlign: 'center', marginBottom: spacing.xs }]}>
                  Workflow: Step {currentWorkflowStep + 1} of {workflow.steps.length}
                </Text>
                <View style={[styles.stepIndicators, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                  {workflow.steps.map((step, index) => (
                    <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={[
                          styles.stepDot,
                          {
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: index < currentWorkflowStep
                              ? colors.success
                              : index === currentWorkflowStep
                                ? colors.primary
                                : colors.surface,
                            marginHorizontal: 3,
                          }
                        ]}
                      />
                      {index < workflow.steps.length - 1 && (
                        <View style={[styles.stepLine, { width: 20, height: 2, backgroundColor: index < currentWorkflowStep ? colors.success : colors.surface }]} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.progressWrapper, { marginTop: spacing.sm }]}>
              <AnimatedProgressBar
                progress={progress}
                currentStage={currentStage?.index !== undefined ? currentStage.index + 1 : undefined}
                totalStages={processingStages.length}
                showStages={false}
              />
            </View>
            
            <ProcessingStatusMessage
              message={status}
              estimatedTime={estimatedTime}
              currentStage={currentStage ? {
                index: currentStage.index,
                total: processingStages.length,
              } : undefined}
              compact={true}
            />
            
            <CompactStatsBar
              time={`${getAverageProcessingTime(editMode)}s`}
              credits={(() => {
                // Calculate dynamic cost for ENHANCE
                let cost: number;
                if (editMode === EditMode.ENHANCE && config) {
                  cost = 0.3;
                  if (config.outscale === 4) cost += 0.1;
                  if (config.faceEnhance === true) cost += 0.2;
                } else {
                  cost = modeData?.creditCost ?? 1;
                }
                return formatCreditCost(cost);
              })()}
              rating="4.9"
              usage="2.3k"
            />

            {/* Options Used - Show config options when available */}
            {config && (() => {
              const schema = getOptionsSchema(editMode);
              return schema ? (
                <View style={{ marginTop: spacing.md }}>
                  <OptionsUsed
                    config={config}
                    schema={schema}
                    defaultExpanded={false}
                  />
                </View>
              ) : null;
            })()}

            {showCancel && isProcessing && (
              <TouchableOpacity
                onPress={handleCancel}
                style={[styles.cancelButton, {
                  marginTop: spacing.md,
                  backgroundColor: colors.surface + 'CC',
                  borderColor: colors.border,
                  borderWidth: 1,
                }]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cancelText,
                    { 
                      color: colors.text,
                      fontSize: typography.size.base,
                      fontWeight: typography.weight.medium,
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
    opacity: 0.5,
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
    width: '100%',
    // marginTop handled inline
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelText: {
    // Dynamic styling applied inline
  },
  processingCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  workflowSteps: {
    // Dynamic styling applied inline
  },
  workflowStepText: {
    // Dynamic styling applied inline
  },
  stepIndicators: {
    // Dynamic styling applied inline
  },
  stepDot: {
    // Dynamic styling applied inline
  },
  stepLine: {
    // Dynamic styling applied inline
  },
});

export default ProcessingScreen;
