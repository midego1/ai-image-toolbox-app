import { EditMode } from '../types/editModes';

export interface ProcessingStage {
  message: string;
  progress: number; // 0-100
  estimatedTimeSeconds: number;
}

/**
 * Default average processing times per edit mode (in seconds)
 * These represent realistic average processing times (5-15 seconds range)
 */
const DEFAULT_AVERAGE_TIMES: Partial<Record<EditMode, number>> = {
  [EditMode.REMOVE_BACKGROUND]: 8,      // Fast, optimized model
  [EditMode.VIRTUAL_TRY_ON]: 12,        // More complex, but still fast
  [EditMode.PROFESSIONAL_HEADSHOTS]: 10, // Fast single-step processing
  [EditMode.REMOVE_OBJECT]: 10,         // Similar to background removal
  [EditMode.REPLACE_BACKGROUND]: 10,    // Similar processing time
  [EditMode.TRANSFORM]: 12,             // Style transformation
  [EditMode.POP_FIGURE]: 15,           // More complex rendering
  [EditMode.ENHANCE]: 10,              // Enhancement processing
  [EditMode.FILTERS]: 5,               // Fast filter application
  [EditMode.FACE_ENHANCE]: 10,         // Face enhancement
  [EditMode.STYLE_TRANSFER]: 12,       // Style transfer
  [EditMode.TEXT_OVERLAY]: 3,          // Very fast, local processing
  [EditMode.CROP_ROTATE]: 2,           // Very fast, local processing
};

/**
 * Base processing stages with proportional time weights
 * These will be scaled to match the target average time
 */
const BASE_STAGES: Record<EditMode, Omit<ProcessingStage, 'estimatedTimeSeconds'>[]> = {
  [EditMode.REMOVE_BACKGROUND]: [
    { message: 'Detecting subject...', progress: 25 },
    { message: 'Refining edges...', progress: 60 },
    { message: 'Finalizing...', progress: 90 },
  ],
  [EditMode.VIRTUAL_TRY_ON]: [
    { message: 'Analyzing person...', progress: 20 },
    { message: 'Applying clothing items...', progress: 60 },
    { message: 'Adjusting fit and lighting...', progress: 85 },
  ],
  [EditMode.PROFESSIONAL_HEADSHOTS]: [
    { message: 'Enhancing face...', progress: 30 },
    { message: 'Applying professional background...', progress: 65 },
    { message: 'Adjusting lighting and contrast...', progress: 90 },
  ],
  [EditMode.REMOVE_OBJECT]: [
    { message: 'Identifying objects...', progress: 25 },
    { message: 'Removing and inpainting...', progress: 70 },
    { message: 'Finalizing...', progress: 95 },
  ],
  [EditMode.REPLACE_BACKGROUND]: [
    { message: 'Isolating subject...', progress: 30 },
    { message: 'Blending new background...', progress: 70 },
    { message: 'Adjusting lighting and shadows...', progress: 90 },
  ],
  [EditMode.TRANSFORM]: [
    { message: 'Analyzing image...', progress: 25 },
    { message: 'Applying AI transformation...', progress: 70 },
    { message: 'Finalizing style...', progress: 90 },
  ],
  [EditMode.POP_FIGURE]: [
    { message: 'Analyzing photo...', progress: 20 },
    { message: 'Creating 3D model...', progress: 60 },
    { message: 'Rendering Pop Figure...', progress: 90 },
  ],
  [EditMode.ENHANCE]: [
    { message: 'Analyzing image quality...', progress: 30 },
    { message: 'Enhancing details...', progress: 70 },
    { message: 'Optimizing output...', progress: 90 },
  ],
  [EditMode.FILTERS]: [
    { message: 'Analyzing colors...', progress: 30 },
    { message: 'Applying filter...', progress: 80 },
    { message: 'Finalizing...', progress: 95 },
  ],
  [EditMode.FACE_ENHANCE]: [
    { message: 'Detecting faces...', progress: 25 },
    { message: 'Enhancing facial features...', progress: 70 },
    { message: 'Finalizing...', progress: 90 },
  ],
  [EditMode.STYLE_TRANSFER]: [
    { message: 'Analyzing style...', progress: 25 },
    { message: 'Transferring style...', progress: 70 },
    { message: 'Blending styles...', progress: 90 },
  ],
  [EditMode.TEXT_OVERLAY]: [
    { message: 'Preparing text overlay...', progress: 40 },
    { message: 'Rendering text...', progress: 90 },
  ],
  [EditMode.CROP_ROTATE]: [
    { message: 'Processing...', progress: 50 },
    { message: 'Finalizing...', progress: 100 },
  ],
};

/**
 * Calculate stage time weights based on progress ranges
 */
const calculateStageWeights = (stages: Omit<ProcessingStage, 'estimatedTimeSeconds'>[]): number[] => {
  const weights: number[] = [];
  let prevProgress = 0;
  
  for (const stage of stages) {
    // Weight is based on progress range of the stage
    const progressRange = stage.progress - prevProgress;
    weights.push(progressRange);
    prevProgress = stage.progress;
  }
  
  return weights;
};

/**
 * Get processing stages for a specific edit mode
 * @param editMode The edit mode to get stages for
 * @param averageTimeSeconds Optional: Override the default average time for this mode
 * @returns Array of processing stages with realistic time estimates
 */
export const getProcessingStages = (
  editMode: EditMode,
  averageTimeSeconds?: number
): ProcessingStage[] => {
  // Get base stages for this edit mode
  const baseStages = BASE_STAGES[editMode] || [
    { message: 'Preparing...', progress: 20 },
    { message: 'Processing with AI...', progress: 70 },
    { message: 'Finalizing...', progress: 90 },
  ];

  // Determine target average time
  const targetAverageTime = averageTimeSeconds ?? DEFAULT_AVERAGE_TIMES[editMode] ?? 10;

  // Calculate weights for each stage based on progress ranges
  const weights = calculateStageWeights(baseStages);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Scale each stage's time proportionally to match target average
  const stages: ProcessingStage[] = baseStages.map((baseStage, index) => {
    // Calculate proportional time based on progress weight
    const proportionalTime = (weights[index] / totalWeight) * targetAverageTime;
    
    return {
      ...baseStage,
      // Round to 1 decimal place, minimum 0.5 seconds
      estimatedTimeSeconds: Math.max(0.5, Math.round(proportionalTime * 10) / 10),
    };
  });

  return stages;
};

/**
 * Get the current stage based on progress
 */
export const getCurrentStage = (
  stages: ProcessingStage[],
  currentProgress: number
): { stage: ProcessingStage; index: number } | null => {
  for (let i = 0; i < stages.length; i++) {
    if (currentProgress <= stages[i].progress) {
      return { stage: stages[i], index: i };
    }
  }
  // Return last stage if progress is beyond all stages
  return { stage: stages[stages.length - 1], index: stages.length - 1 };
};

/**
 * Calculate estimated remaining time based on current progress
 */
export const getEstimatedRemainingTime = (
  stages: ProcessingStage[],
  currentProgress: number
): number | null => {
  const current = getCurrentStage(stages, currentProgress);
  if (!current) return null;

  const { stage, index } = current;

  // Calculate time spent in current stage
  const stageProgress = currentProgress / stage.progress;
  const timeSpent = stageProgress * stage.estimatedTimeSeconds;

  // Calculate remaining time in current stage
  const remainingInStage = stage.estimatedTimeSeconds - timeSpent;

  // Add time for remaining stages
  let totalRemaining = remainingInStage;
  for (let i = index + 1; i < stages.length; i++) {
    totalRemaining += stages[i].estimatedTimeSeconds;
  }

  return Math.max(0, totalRemaining);
};

/**
 * Get the default average processing time for an edit mode
 * @param editMode The edit mode to get the average time for
 * @returns The average processing time in seconds
 */
export const getAverageProcessingTime = (editMode: EditMode): number => {
  return DEFAULT_AVERAGE_TIMES[editMode] ?? 10;
};

