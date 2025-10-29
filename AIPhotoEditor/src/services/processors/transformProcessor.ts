import { BaseProcessor } from './baseProcessor';
import { AIService } from '../aiService';
import { TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
// Genre type is defined in constants/Genres.ts but not needed here

/**
 * Transform Processor
 * Handles genre/style transformations using AI
 */
export class TransformProcessor extends BaseProcessor {
  /**
   * Process image transformation with genre/style prompt
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    // Extract prompt from config (should contain genre prompt)
    const prompt = config?.prompt as string | undefined;
    if (!prompt) {
      return this.createErrorResponse('Prompt is required for transformation');
    }

    try {
      // Use existing AIService transformImage method
      const result = await AIService.transformImage(imageUri, prompt);
      return result;
    } catch (error: any) {
      console.error('TransformProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to transform image'
      );
    }
  }
}

