import { EditMode, EditModeConfig } from './editModes';

/**
 * Represents a single step in a multi-step workflow
 */
export interface WorkflowStep {
  id: string;
  editMode: EditMode;
  displayName: string;
  config?: EditModeConfig;
  estimatedTimeMs: number;
}

/**
 * Configuration for a complete workflow
 */
export interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isPremium?: boolean;
  totalEstimatedTime?: number;
}

/**
 * Result from executing a workflow step
 */
export interface WorkflowStepResult {
  stepId: string;
  imageUri: string;
  editMode: EditMode;
  success: boolean;
  error?: string;
  processingTimeMs?: number;
}

/**
 * State of an ongoing workflow execution
 */
export interface WorkflowExecution {
  workflowId: string;
  currentStepIndex: number;
  stepResults: WorkflowStepResult[];
  status: 'running' | 'paused' | 'complete' | 'failed';
  startTime: number;
  error?: string;
}

/**
 * Predefined workflow templates for testing
 */
export const TEST_WORKFLOWS: WorkflowConfig[] = [
  {
    id: 'funko-basic',
    name: 'Basic Funko Pop',
    description: 'Single step Funko Pop creation',
    isPremium: false,
    steps: [
      {
        id: 'funko',
        editMode: 'pop_figure' as EditMode,
        displayName: 'Creating Funko Pop',
        config: {},
        estimatedTimeMs: 30000
      }
    ]
  },
  {
    id: 'funko-enhanced',
    name: 'Enhanced Funko Pop',
    description: 'Funko Pop with 4x upscaling for better quality',
    isPremium: false,
    steps: [
      {
        id: 'funko',
        editMode: 'pop_figure' as EditMode,
        displayName: 'Creating Funko Pop',
        config: {},
        estimatedTimeMs: 30000
      },
      {
        id: 'upscale',
        editMode: 'upscale' as EditMode,
        displayName: 'Upscaling to 4K',
        config: { outscale: 4 },
        estimatedTimeMs: 25000
      }
    ]
  },
  {
    id: 'funko-premium',
    name: 'Premium Funko Pop',
    description: 'Funko Pop with upscaling and AI enhancement',
    isPremium: true,
    steps: [
      {
        id: 'remove-bg',
        editMode: 'remove_background' as EditMode,
        displayName: 'Removing Background',
        config: {},
        estimatedTimeMs: 10000
      },
      {
        id: 'funko',
        editMode: 'pop_figure' as EditMode,
        displayName: 'Creating Funko Pop',
        config: {},
        estimatedTimeMs: 30000
      },
      {
        id: 'upscale',
        editMode: 'upscale' as EditMode,
        displayName: 'Upscaling to 4K',
        config: { outscale: 4 },
        estimatedTimeMs: 25000
      },
      {
        id: 'enhance',
        editMode: 'enhance' as EditMode,
        displayName: 'AI Enhancement',
        config: {},
        estimatedTimeMs: 20000
      }
    ]
  },
  {
    id: 'pixel-upscale',
    name: 'Pixel Art + Upscale',
    description: 'Convert to pixel art then upscale for sharp details',
    isPremium: false,
    steps: [
      {
        id: 'pixel',
        editMode: 'pixel_art_gamer' as EditMode,
        displayName: 'Creating Pixel Art',
        config: {},
        estimatedTimeMs: 30000
      },
      {
        id: 'upscale',
        editMode: 'upscale' as EditMode,
        displayName: 'Upscaling',
        config: { outscale: 2 },
        estimatedTimeMs: 20000
      }
    ]
  },
  {
    id: 'headshot-enhance',
    name: 'Professional Headshot Enhanced',
    description: 'Create professional headshot with enhancement',
    isPremium: true,
    steps: [
      {
        id: 'headshot',
        editMode: 'professional_headshots' as EditMode,
        displayName: 'Creating Headshot',
        config: {},
        estimatedTimeMs: 35000
      },
      {
        id: 'enhance',
        editMode: 'enhance' as EditMode,
        displayName: 'Enhancing Quality',
        config: {},
        estimatedTimeMs: 20000
      }
    ]
  }
];
