import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Alert, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ImageProcessingService } from '../services/imageProcessingService';
import { NavigationProp, RouteProp } from '../types/navigation';
import { WorkflowConfig, WorkflowStepResult } from '../types/workflow';
import { useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

const WorkflowProcessingScreen = () => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;
  const navigation = useNavigation<NavigationProp<'Result'>>();
  const route = useRoute<RouteProp<'Processing'>>();
  const { imageUri, workflow } = route.params;

  if (!workflow) {
    Alert.alert('Error', 'No workflow provided');
    navigation.goBack();
    return null;
  }

  const creationId = route.params.creationId || `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // State management
  const [currentStepIndex, setCurrentStepIndex] = useState(route.params.workflowStepIndex || 0);
  const [stepResults, setStepResults] = useState<WorkflowStepResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [currentStepName, setCurrentStepName] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    processWorkflow();
  }, []);

  const processWorkflow = async () => {
    try {
      const steps = workflow.steps;
      let currentImageUri = imageUri;

      for (let i = currentStepIndex; i < steps.length; i++) {
        const step = steps[i];
        setCurrentStepIndex(i);
        setCurrentStepName(step.displayName);
        setOverallProgress(Math.floor((i / steps.length) * 100));

        console.log(`[WorkflowProcessing] Processing step ${i + 1}/${steps.length}: ${step.displayName}`);

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
          setError(errorMsg);
          setIsProcessing(false);

          // Show error with option to retry or save partial results
          Alert.alert(
            'Processing Failed',
            errorMsg + '\n\nWould you like to save the results from previous steps?',
            [
              {
                text: 'Retry Step',
                onPress: () => {
                  setError(null);
                  setIsProcessing(true);
                  // Retry from current step
                  processWorkflow();
                }
              },
              {
                text: 'Save Partial Results',
                onPress: () => {
                  if (stepResults.length > 0) {
                    // Navigate to result with partial results
                    const lastSuccessfulResult = stepResults[stepResults.length - 1];
                    navigation.replace('Result', {
                      originalImage: imageUri,
                      transformedImage: lastSuccessfulResult.imageUri,
                      editMode: lastSuccessfulResult.editMode,
                      createdAt: Date.now(),
                      creationId,
                      workflowResults: stepResults
                    });
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

        setStepResults(prev => [...prev, stepResult]);
        currentImageUri = result.imageUri;

        console.log(`[WorkflowProcessing] Step ${i + 1} completed successfully`);
      }

      // All steps complete!
      setOverallProgress(100);
      setIsProcessing(false);

      console.log('[WorkflowProcessing] All steps completed! Navigating to Result...');

      // Navigate to result with all workflow results
      setTimeout(() => {
        navigation.replace('Result', {
          originalImage: imageUri,
          transformedImage: currentImageUri,
          editMode: steps[steps.length - 1].editMode,
          createdAt: Date.now(),
          creationId,
          workflowResults: stepResults
        });
      }, 500);

    } catch (error: any) {
      console.error('[WorkflowProcessing] Unexpected error:', error);
      setError(error.message || 'An unexpected error occurred');
      setIsProcessing(false);
      Alert.alert(
        'Error',
        error.message || 'An unexpected error occurred during workflow processing.',
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
    Alert.alert(
      'Cancel Workflow?',
      'Are you sure you want to cancel? Your progress will be lost.',
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Cancel Workflow',
          style: 'destructive',
          onPress: () => {
            setIsProcessing(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const totalSteps = workflow.steps.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image source={{ uri: imageUri }} style={styles.backgroundImage} />
      <View style={styles.blurOverlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />
      </View>
      <LinearGradient
        colors={[colors.overlayDark, 'transparent', colors.overlayDark]}
        style={styles.gradient}
      />

      <View style={[styles.content, { padding: spacing.xl }]}>
        <View style={[styles.card, {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 16,
          padding: spacing.lg,
        }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontSize: typography.size.xl }]}>
              {workflow.name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.size.sm }]}>
              Multi-Step Workflow
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={[styles.progressContainer, { marginTop: spacing.lg }]}>
            <Text style={[styles.progressText, { color: colors.text, marginBottom: spacing.sm }]}>
              Step {currentStepIndex + 1} of {totalSteps}
            </Text>

            {/* Step Circles */}
            <View style={styles.stepsRow}>
              {workflow.steps.map((step, index) => (
                <View key={step.id} style={styles.stepItem}>
                  <View style={[
                    styles.stepCircle,
                    {
                      backgroundColor: index < currentStepIndex
                        ? colors.primary
                        : index === currentStepIndex
                          ? colors.primary + '80'
                          : colors.surface,
                      borderColor: colors.primary,
                      borderWidth: index === currentStepIndex ? 2 : 0,
                    }
                  ]}>
                    {index < currentStepIndex ? (
                      <Ionicons name="checkmark" size={16} color={colors.background} />
                    ) : (
                      <Text style={[styles.stepNumber, { color: index === currentStepIndex ? colors.background : colors.textSecondary }]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {index < totalSteps - 1 && (
                    <View style={[
                      styles.stepLine,
                      { backgroundColor: index < currentStepIndex ? colors.primary : colors.surface }
                    ]} />
                  )}
                </View>
              ))}
            </View>

            {/* Overall Progress Bar */}
            <View style={[styles.progressBarContainer, { backgroundColor: colors.surface, marginTop: spacing.md }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${overallProgress}%`,
                    backgroundColor: colors.primary,
                  }
                ]}
              />
            </View>
            <Text style={[styles.percentText, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {overallProgress}% Complete
            </Text>
          </View>

          {/* Current Step */}
          <View style={[styles.currentStepContainer, { marginTop: spacing.lg, backgroundColor: colors.surface + '40', borderRadius: 12, padding: spacing.md }]}>
            <Text style={[styles.currentStepLabel, { color: colors.textSecondary, fontSize: typography.size.xs }]}>
              {isProcessing ? 'CURRENTLY PROCESSING' : error ? 'FAILED' : 'COMPLETED'}
            </Text>
            <Text style={[styles.currentStepName, { color: colors.text, fontSize: typography.size.lg, marginTop: spacing.xs }]}>
              {currentStepName || workflow.steps[currentStepIndex]?.displayName || 'Processing...'}
            </Text>
          </View>

          {/* Completed Steps Preview */}
          {stepResults.length > 0 && (
            <ScrollView
              horizontal
              style={[styles.resultsScroll, { marginTop: spacing.lg }]}
              showsHorizontalScrollIndicator={false}
            >
              {stepResults.map((result, index) => (
                <View key={result.stepId} style={styles.resultPreview}>
                  <Image
                    source={{ uri: result.imageUri }}
                    style={[styles.previewImage, { borderColor: colors.border }]}
                  />
                  <Text style={[styles.previewLabel, { color: colors.textSecondary, fontSize: typography.size.xs }]}>
                    Step {index + 1} ✓
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Cancel Button */}
          {isProcessing && (
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.cancelButton, {
                marginTop: spacing.lg,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: spacing.md,
              }]}
            >
              <Text style={[styles.cancelText, { color: colors.text, fontSize: typography.size.base }]}>
                Cancel Workflow
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  },
  card: {
    width: '100%',
    maxWidth: 500,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    width: 30,
    height: 2,
    marginHorizontal: 4,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentText: {
    textAlign: 'center',
    fontSize: 12,
  },
  currentStepContainer: {
    alignItems: 'center',
  },
  currentStepLabel: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  currentStepName: {
    fontWeight: '600',
  },
  resultsScroll: {
    maxHeight: 120,
  },
  resultPreview: {
    marginRight: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
  },
  previewLabel: {
    marginTop: 4,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelText: {
    fontWeight: '600',
  },
});

export default WorkflowProcessingScreen;
