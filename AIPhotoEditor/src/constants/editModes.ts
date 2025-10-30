import { EditMode, EditModeData, EditModeCategory } from '../types/editModes';

// Re-export for convenience
export { EditMode, EditModeCategory, EditModeData, EditModeConfig } from '../types/editModes';

/**
 * Edit Mode Definitions
 * Central registry of all available image editing modes
 */

export const EDIT_MODES: Record<EditMode, EditModeData> = {
  [EditMode.TRANSFORM]: {
    id: EditMode.TRANSFORM,
    name: 'Transform',
    description: 'Transform photos with AI styles',
    icon: '🎨',
    category: EditModeCategory.TRANSFORM,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 1,
  },
  [EditMode.REMOVE_BACKGROUND]: {
    id: EditMode.REMOVE_BACKGROUND,
    name: 'Remove Background',
    description: 'AI-powered background removal with modern UI',
    icon: '🎯',
    category: EditModeCategory.EDIT,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 0.1, // 0.1 credits (10x cheaper to encourage maximum usage)
  },
  [EditMode.ENHANCE]: {
    id: EditMode.ENHANCE,
    name: 'Enhance',
    description: 'Upscale and improve quality',
    icon: '✨',
    category: EditModeCategory.ENHANCE,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 1,
  },
  [EditMode.FILTERS]: {
    id: EditMode.FILTERS,
    name: 'Filters',
    description: 'Color grading and effects',
    icon: '🌈',
    category: EditModeCategory.STYLIZE,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 1,
  },
  [EditMode.REMOVE_OBJECT]: {
    id: EditMode.REMOVE_OBJECT,
    name: 'Remove Object',
    description: 'Remove unwanted objects',
    icon: '🗑️',
    category: EditModeCategory.EDIT,
    isPremium: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.REPLACE_BACKGROUND]: {
    id: EditMode.REPLACE_BACKGROUND,
    name: 'Replace Background',
    description: 'Change background with AI',
    icon: '🖼️',
    category: EditModeCategory.EDIT,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.FACE_ENHANCE]: {
    id: EditMode.FACE_ENHANCE,
    name: 'Face Enhance',
    description: 'Improve face quality',
    icon: '👤',
    category: EditModeCategory.ENHANCE,
    isPremium: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.STYLE_TRANSFER]: {
    id: EditMode.STYLE_TRANSFER,
    name: 'Style Transfer',
    description: 'Apply artistic styles',
    icon: '🖌️',
    category: EditModeCategory.STYLIZE,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.TEXT_OVERLAY]: {
    id: EditMode.TEXT_OVERLAY,
    name: 'Text Overlay',
    description: 'Add text to images',
    icon: '📝',
    category: EditModeCategory.EDIT,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only (could be made free later)
    creditCost: 0, // No API cost, but subscription-only
  },
  [EditMode.CROP_ROTATE]: {
    id: EditMode.CROP_ROTATE,
    name: 'Crop & Rotate',
    description: 'Basic editing tools',
    icon: '📐',
    category: EditModeCategory.EDIT,
    requiresSubscription: false, // Always free
    creditCost: 0, // No API cost, local processing
  },
  [EditMode.VIRTUAL_TRY_ON]: {
    id: EditMode.VIRTUAL_TRY_ON,
    name: 'Virtual Try-On',
    description: 'Try on clothes before you buy',
    icon: '👗',
    category: EditModeCategory.EDIT,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.PROFESSIONAL_HEADSHOTS]: {
    id: EditMode.PROFESSIONAL_HEADSHOTS,
    name: 'Professional Headshots',
    description: 'Create LinkedIn-quality professional portraits',
    icon: '💼',
    category: EditModeCategory.ENHANCE,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1, // 1 credit for single-step Nano Banana processing
  },
};

/**
 * Get all edit modes by category
 */
export const getEditModesByCategory = (category: EditModeCategory): EditModeData[] => {
  return Object.values(EDIT_MODES).filter(mode => mode.category === category);
};

/**
 * Get available edit modes (excludes subscription-only if user is not subscribed)
 */
export const getAvailableEditModes = (isPremium: boolean = false): EditModeData[] => {
  // Legacy compatibility: isPremium maps to requiresSubscription
  return Object.values(EDIT_MODES).filter(
    mode => !mode.requiresSubscription || isPremium
  );
};

/**
 * Get edit mode by ID
 */
export const getEditMode = (id: EditMode): EditModeData | undefined => {
  return EDIT_MODES[id];
};

/**
 * Phase 1 (Core) features - always available
 */
export const PHASE1_FEATURES: EditMode[] = [
  EditMode.TRANSFORM,
  EditMode.REMOVE_BACKGROUND,
  EditMode.ENHANCE,
  EditMode.FILTERS,
  EditMode.REMOVE_OBJECT,
];

/**
 * Phase 2 (Advanced) features - premium
 */
export const PHASE2_FEATURES: EditMode[] = [
  EditMode.REPLACE_BACKGROUND,
  EditMode.FACE_ENHANCE,
  EditMode.STYLE_TRANSFER,
  EditMode.TEXT_OVERLAY,
  EditMode.CROP_ROTATE,
];

