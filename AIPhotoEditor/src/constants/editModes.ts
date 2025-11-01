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
    description: 'Apply curated AI art styles while preserving identity and composition. Great for portraits and social posts.',
    icon: '🎨',
    category: EditModeCategory.TRANSFORM,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 1,
  },
  [EditMode.REMOVE_BACKGROUND]: {
    id: EditMode.REMOVE_BACKGROUND,
    name: 'Remove Background',
    description: 'Precisely cut out subjects with edge-aware AI. Export transparent PNGs or replace later in one tap.',
    icon: '🎯',
    category: EditModeCategory.EDIT,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 0.3, // 0.3 credits - low-cost model pricing
  },
  [EditMode.ENHANCE]: {
    id: EditMode.ENHANCE,
    name: 'Upscale',
    description: 'Upscale, sharpen, and reduce noise while keeping skin tones natural. Ideal for low‑light and old photos.',
    icon: '✨',
    category: EditModeCategory.ENHANCE,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 0.3, // 0.3 credits - Real-ESRGAN pricing (~$0.024-0.03 with 2x markup)
  },
  [EditMode.UPSCALE]: {
    id: EditMode.UPSCALE,
    name: 'Upscale',
    description: 'Upscale, sharpen, and reduce noise while keeping skin tones natural. Ideal for low‑light and old photos.',
    icon: '✨',
    category: EditModeCategory.ENHANCE,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 0.3, // 0.3 credits - Real-ESRGAN pricing (~$0.024-0.03 with 2x markup)
  },
  [EditMode.FILTERS]: {
    id: EditMode.FILTERS,
    name: 'Filters',
    description: 'One‑tap cinematic color grades and effects with adjustable intensity. Non‑destructive previews included.',
    icon: '🌈',
    category: EditModeCategory.STYLIZE,
    requiresConfig: true,
    requiresSubscription: false, // Free but credit-limited
    creditCost: 1,
  },
  [EditMode.REMOVE_OBJECT]: {
    id: EditMode.REMOVE_OBJECT,
    name: 'Remove Object',
    description: 'Brush away distractions and people with content‑aware fill. Seamlessly recreates the background.',
    icon: '🗑️',
    category: EditModeCategory.EDIT,
    isPremium: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.REPLACE_BACKGROUND]: {
    id: EditMode.REPLACE_BACKGROUND,
    name: 'Replace Background',
    description: 'Swap scenes instantly: studios, offices, beaches, and more with realistic lighting and shadows.',
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
    description: 'Restore facial details, remove compression, and smooth artifacts while keeping identity intact.',
    icon: '👤',
    category: EditModeCategory.ENHANCE,
    isPremium: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.STYLE_TRANSFER]: {
    id: EditMode.STYLE_TRANSFER,
    name: 'Style Transfer',
    description: 'Blend your photo with famous art styles and textures. Fine‑tune strength for subtle or bold looks.',
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
    description: 'Add titles, captions, and watermarks with professional typography presets and alignment guides.',
    icon: '📝',
    category: EditModeCategory.EDIT,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only (could be made free later)
    creditCost: 0, // No API cost, but subscription-only
  },
  [EditMode.CROP_ROTATE]: {
    id: EditMode.CROP_ROTATE,
    name: 'Crop & Rotate',
    description: 'Straighten horizons, crop to social sizes, and fix perspective with live guides and snapping.',
    icon: '📐',
    category: EditModeCategory.EDIT,
    requiresSubscription: false, // Always free
    creditCost: 0, // No API cost, local processing
  },
  [EditMode.VIRTUAL_TRY_ON]: {
    id: EditMode.VIRTUAL_TRY_ON,
    name: 'Virtual Try-On',
    description: 'Preview outfits on your photo with realistic fabric drape and lighting. Works with tops and dresses.',
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
    description: 'Generate polished, studio‑quality portraits with corporate backdrops, flattering lighting, and retouching.',
    icon: '💼',
    category: EditModeCategory.ENHANCE,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1, // 1 credit for single-step Nano Banana processing
  },
  [EditMode.POP_FIGURE]: {
    id: EditMode.POP_FIGURE,
    name: 'Pop Figure',
    description: 'Transform your photo into a detailed 3D render of a chibi pop figure with collectible box options, strictly based on the provided reference photo.',
    icon: '🧸',
    category: EditModeCategory.TRANSFORM,
    isPremium: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.PIXEL_ART_GAMER]: {
    id: EditMode.PIXEL_ART_GAMER,
    name: 'Pixel Art Gamer',
    description: 'Transform your photo into a retro 8-bit or 16-bit video game sprite. Perfect for RPG characters, platformers, and classic arcade game aesthetics.',
    icon: '🎮',
    category: EditModeCategory.TRANSFORM,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  [EditMode.GHIBLIFY]: {
    id: EditMode.GHIBLIFY,
    name: 'Ghiblify',
    description: 'Transform your photo into Studio Ghibli\'s iconic animation style with soft colors, hand-painted aesthetics, and whimsical charm.',
    icon: '🌸',
    category: EditModeCategory.TRANSFORM,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 1,
  },
  // Video modes
  [EditMode.TEXT_TO_VIDEO_VEO]: {
    id: EditMode.TEXT_TO_VIDEO_VEO,
    name: 'Text to Video (Veo)',
    description: 'Create high-fidelity, cinematic videos from text prompts with synchronized audio and smooth motion.',
    icon: '🎬',
    category: EditModeCategory.VIDEO,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 25, // Higher cost for video generation - ensures 50%+ profit margin
  },
  [EditMode.TEXT_TO_VIDEO_VEO_FAST]: {
    id: EditMode.TEXT_TO_VIDEO_VEO_FAST,
    name: 'Text to Video (Fast)',
    description: 'Generate videos quickly with faster rendering and lower cost. Perfect for rapid prototyping.',
    icon: '🚀',
    category: EditModeCategory.VIDEO,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 20, // Lower cost for fast variant - ensures 50%+ profit margin
  },
  [EditMode.TEXT_TO_VIDEO_KLING]: {
    id: EditMode.TEXT_TO_VIDEO_KLING,
    name: 'Text to Video (Kling)',
    description: 'Generate hyper-realistic videos with advanced physics simulation and high-resolution outputs.',
    icon: '🎥',
    category: EditModeCategory.VIDEO,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 30, // Higher cost for premium quality - ensures 50%+ profit margin
  },
  [EditMode.EDIT_VIDEO_RUNWAY]: {
    id: EditMode.EDIT_VIDEO_RUNWAY,
    name: 'Edit Video (Runway)',
    description: 'Advanced video editing: add/remove objects, relighting, angle changes, and style transformations.',
    icon: '✂️',
    category: EditModeCategory.VIDEO,
    isPremium: true,
    requiresConfig: true,
    requiresSubscription: true, // Subscription-only
    creditCost: 40, // Highest cost for complex editing - ensures 50%+ profit margin
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

