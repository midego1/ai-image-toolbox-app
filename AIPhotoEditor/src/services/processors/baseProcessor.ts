import { TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Base Processor Interface
 * All image processors must implement this interface
 */
export interface IProcessor {
  /**
   * Process an image with the given configuration
   * @param imageUri - URI of the image to process
   * @param config - Optional configuration specific to the processor
   * @returns TransformResponse with success status and processed image URI
   */
  process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse>;
}

/**
 * Base Processor Class
 * Provides common functionality for all processors
 */
export abstract class BaseProcessor implements IProcessor {
  /**
   * Process the image - must be implemented by each processor
   */
  abstract process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse>;

  /**
   * Validate image URI
   */
  protected validateImageUri(imageUri: string): boolean {
    if (!imageUri || typeof imageUri !== 'string') {
      return false;
    }
    return true;
  }

  /**
   * Create error response
   */
  protected createErrorResponse(error: string): TransformResponse {
    return {
      success: false,
      error,
    };
  }

  /**
   * Create success response
   */
  protected createSuccessResponse(imageUri: string): TransformResponse {
    return {
      success: true,
      imageUri,
    };
  }
}

