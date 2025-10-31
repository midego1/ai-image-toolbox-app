import { VideoTransformResponse, VideoConfig } from '../../types/video';
import { EditModeConfig } from '../../types/editModes';

/**
 * Base Video Processor Interface
 * All video processors must implement this interface
 */
export interface IVideoProcessor {
  /**
   * Process a video with the given configuration
   * @param inputUri - URI of the input (image for text-to-video, or video for video editing)
   * @param config - Optional configuration specific to the processor
   * @returns VideoTransformResponse with success status and processed video URI
   */
  process(inputUri: string, config?: EditModeConfig): Promise<VideoTransformResponse>;
}

/**
 * Base Video Processor Class
 * Provides common functionality for all video processors
 */
export abstract class BaseVideoProcessor implements IVideoProcessor {
  /**
   * Process the video - must be implemented by each processor
   */
  abstract process(inputUri: string, config?: EditModeConfig): Promise<VideoTransformResponse>;

  /**
   * Validate input URI (image or video)
   */
  protected validateInputUri(inputUri: string): boolean {
    if (!inputUri || typeof inputUri !== 'string') {
      return false;
    }
    return true;
  }

  /**
   * Validate video URI
   */
  protected validateVideoUri(videoUri: string): boolean {
    if (!videoUri || typeof videoUri !== 'string') {
      return false;
    }
    // Check if it's a video file extension
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
    const lowerUri = videoUri.toLowerCase();
    return videoExtensions.some(ext => lowerUri.includes(ext));
  }

  /**
   * Create error response
   */
  protected createErrorResponse(error: string): VideoTransformResponse {
    return {
      success: false,
      error,
    };
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(videoUri: string, progress?: number): VideoTransformResponse {
    return {
      success: true,
      videoUri,
      progress,
    };
  }
}

