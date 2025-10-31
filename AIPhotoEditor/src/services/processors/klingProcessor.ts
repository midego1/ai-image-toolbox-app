import { BaseVideoProcessor } from './baseVideoProcessor';
import { KieAIService } from '../kieAIService';
import { VideoTransformResponse } from '../../types/video';
import { EditModeConfig } from '../../types/editModes';

/**
 * Kling 2.1 Processor
 * Generates hyper-realistic videos with advanced physics simulation
 */
export class KlingProcessor extends BaseVideoProcessor {
  async process(inputUri: string, config?: EditModeConfig): Promise<VideoTransformResponse> {
    const prompt = config?.prompt as string | undefined;
    
    if (!prompt || prompt.trim().length === 0) {
      return this.createErrorResponse('Prompt is required for video generation');
    }

    try {
      console.log('[KlingProcessor] Starting video generation with Kling 2.1');
      console.log('[KlingProcessor] Prompt:', prompt);

      const result = await KieAIService.generateVideoWithKling(prompt, {
        duration: (config?.duration as number) || 5,
        aspectRatio: (config?.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
      });

      return result;
    } catch (error: any) {
      console.error('[KlingProcessor] Error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to generate video with Kling 2.1'
      );
    }
  }
}

