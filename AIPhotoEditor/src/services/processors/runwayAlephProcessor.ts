import { BaseVideoProcessor } from './baseVideoProcessor';
import { KieAIService } from '../kieAIService';
import { VideoTransformResponse } from '../../types/video';
import { EditModeConfig } from '../../types/editModes';

/**
 * Runway Aleph Processor
 * Advanced video editing: add/remove objects, relighting, angle changes, style transformations
 */
export class RunwayAlephProcessor extends BaseVideoProcessor {
  async process(inputUri: string, config?: EditModeConfig): Promise<VideoTransformResponse> {
    if (!this.validateVideoUri(inputUri)) {
      return this.createErrorResponse('Invalid video URI provided');
    }

    const operation = (config?.operation as 'remove_object' | 'add_object' | 'style_transfer' | 'relight') || 'remove_object';
    const prompt = config?.prompt as string | undefined;
    const objectToRemove = config?.objectToRemove as string | undefined;
    const style = config?.style as string | undefined;

    if (operation === 'remove_object' && !objectToRemove && !prompt) {
      return this.createErrorResponse('Object to remove or prompt is required for object removal');
    }

    try {
      console.log('[RunwayAlephProcessor] Starting video editing with Runway Aleph');
      console.log('[RunwayAlephProcessor] Operation:', operation);
      console.log('[RunwayAlephProcessor] Video URI:', inputUri);

      const result = await KieAIService.editVideoWithRunway(inputUri, {
        operation,
        prompt,
        objectToRemove,
        style,
      });

      return result;
    } catch (error: any) {
      console.error('[RunwayAlephProcessor] Error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to edit video with Runway Aleph'
      );
    }
  }
}



