/**
 * Edit Mode Type System
 * Defines the different image editing modes available in the app
 */

export enum EditModeCategory {
  TRANSFORM = 'transform',
  ENHANCE = 'enhance',
  EDIT = 'edit',
  STYLIZE = 'stylize',
  VIDEO = 'video',
}

export enum EditMode {
  TRANSFORM = 'transform',
  REMOVE_BACKGROUND = 'remove_background',
  ENHANCE = 'enhance',
  FILTERS = 'filters',
  REMOVE_OBJECT = 'remove_object',
  REPLACE_BACKGROUND = 'replace_background',
  FACE_ENHANCE = 'face_enhance',
  STYLE_TRANSFER = 'style_transfer',
  TEXT_OVERLAY = 'text_overlay',
  CROP_ROTATE = 'crop_rotate',
  VIRTUAL_TRY_ON = 'virtual_try_on',
  PROFESSIONAL_HEADSHOTS = 'professional_headshots',
  POP_FIGURE = 'pop_figure',
  PIXEL_ART_GAMER = 'pixel_art_gamer',
  // Video modes
  TEXT_TO_VIDEO_VEO = 'text_to_video_veo',
  TEXT_TO_VIDEO_VEO_FAST = 'text_to_video_veo_fast',
  TEXT_TO_VIDEO_KLING = 'text_to_video_kling',
  EDIT_VIDEO_RUNWAY = 'edit_video_runway',
}

export interface EditModeData {
  id: EditMode;
  name: string;
  description: string;
  icon: string;
  category: EditModeCategory;
  isPremium?: boolean;
  requiresConfig?: boolean;
  requiresSubscription?: boolean; // true = subscription-only (no free access)
  creditCost?: number; // 0 = free (no credits), 0.1 = 10% credit, 1 = full credit
}

export interface EditModeConfig {
  [key: string]: any;
}

export interface ProcessingParams {
  imageUri: string;
  editMode: EditMode;
  config?: EditModeConfig;
}

