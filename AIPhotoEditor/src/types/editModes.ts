/**
 * Edit Mode Type System
 * Defines the different image editing modes available in the app
 */

export enum EditModeCategory {
  TRANSFORM = 'transform',
  ENHANCE = 'enhance',
  EDIT = 'edit',
  STYLIZE = 'stylize',
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
}

export interface EditModeData {
  id: EditMode;
  name: string;
  description: string;
  icon: string;
  category: EditModeCategory;
  isPremium?: boolean;
  requiresConfig?: boolean;
}

export interface EditModeConfig {
  [key: string]: any;
}

export interface ProcessingParams {
  imageUri: string;
  editMode: EditMode;
  config?: EditModeConfig;
}

