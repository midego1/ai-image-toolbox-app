/**
 * Camera-related types and enums
 */

export type FlashMode = 'off' | 'on' | 'auto';

export type CameraLens = 'standard' | 'ultra-wide' | 'telephoto';

export interface CameraDevice {
  id: string;
  name: string;
  position: 'front' | 'back';
  lens?: CameraLens;
  isAvailable?: boolean;
}

