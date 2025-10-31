/**
 * Video Processing Types
 */

export interface VideoTransformResponse {
  success: boolean;
  videoUri?: string;
  error?: string;
  progress?: number; // 0-1 progress for video processing
}

export interface VideoConfig {
  prompt?: string; // For text-to-video
  videoUri?: string; // For video-to-video editing
  duration?: number; // Duration in seconds
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  quality?: 'low' | 'medium' | 'high';
  [key: string]: any; // Additional config options
}

