import { EditMode } from '../types/editModes';
import { EditModeConfig } from '../types/editModes';
import { VideoTransformResponse } from '../types/video';
import { VeoProcessor } from './processors/veoProcessor';
import { VeoFastProcessor } from './processors/veoFastProcessor';
import { KlingProcessor } from './processors/klingProcessor';
import { RunwayAlephProcessor } from './processors/runwayAlephProcessor';
import { BaseVideoProcessor } from './processors/baseVideoProcessor';

/**
 * Video Processing Service
 * Main router that delegates to appropriate video processor based on edit mode
 */
export class VideoProcessingService {
  private static processors: Map<EditMode, BaseVideoProcessor> = new Map();

  /**
   * Initialize processors (lazy initialization)
   */
  private static initializeProcessors(): void {
    if (this.processors.size === 0) {
      this.processors.set(EditMode.TEXT_TO_VIDEO_VEO, new VeoProcessor());
      this.processors.set(EditMode.TEXT_TO_VIDEO_VEO_FAST, new VeoFastProcessor());
      this.processors.set(EditMode.TEXT_TO_VIDEO_KLING, new KlingProcessor());
      this.processors.set(EditMode.EDIT_VIDEO_RUNWAY, new RunwayAlephProcessor());
    }
  }

  /**
   * Process video based on edit mode
   * @param inputUri - URI of the input (image for text-to-video, or video for editing)
   * @param editMode - The edit mode to apply
   * @param config - Optional configuration for the processor
   * @returns VideoTransformResponse with processed video
   */
  static async processVideo(
    inputUri: string,
    editMode: EditMode,
    config?: EditModeConfig
  ): Promise<VideoTransformResponse> {
    this.initializeProcessors();

    const processor = this.processors.get(editMode);
    
    if (!processor) {
      return {
        success: false,
        error: `Processor not available for edit mode: ${editMode}. This feature may not be implemented yet.`,
      };
    }

    try {
      console.log(`[VideoProcessingService] Processing ${editMode}...`);
      const result = await processor.process(inputUri, config);
      console.log(`[VideoProcessingService] Processor returned:`, {
        success: result.success,
        hasVideoUri: !!result.videoUri,
        error: result.error
      });
      return result;
    } catch (error: any) {
      console.error(`[VideoProcessingService] Error for ${editMode}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to process video',
      };
    }
  }

  /**
   * Check if a video edit mode is supported
   */
  static isModeSupported(editMode: EditMode): boolean {
    this.initializeProcessors();
    return this.processors.has(editMode);
  }

  /**
   * Get all supported video edit modes
   */
  static getSupportedModes(): EditMode[] {
    this.initializeProcessors();
    return Array.from(this.processors.keys());
  }
}

