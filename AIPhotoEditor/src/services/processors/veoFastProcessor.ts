import { BaseVideoProcessor } from './baseVideoProcessor';
import { KieAIService } from '../kieAIService';
import { VideoTransformResponse } from '../../types/video';
import { EditModeConfig } from '../../types/editModes';

/**
 * Veo 3.1 Fast Processor
 * Generates videos quickly with faster rendering and lower cost
 */
export class VeoFastProcessor extends BaseVideoProcessor {
  async process(inputUri: string, config?: EditModeConfig): Promise<VideoTransformResponse> {
    const prompt = config?.prompt as string | undefined;
    
    if (!prompt || prompt.trim().length === 0) {
      return this.createErrorResponse('Prompt is required for video generation');
    }

    try {
      console.log('[VeoFastProcessor] Starting fast video generation with Veo 3.1 Fast');
      console.log('[VeoFastProcessor] Prompt:', prompt);

      const result = await KieAIService.generateVideoWithVeoFast(prompt, {
        duration: (config?.duration as number) || 5,
        aspectRatio: (config?.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
      });

      return result;
    } catch (error: any) {
      console.error('[VeoFastProcessor] Error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to generate video with Veo 3.1 Fast'
      );
    }
  }
}

