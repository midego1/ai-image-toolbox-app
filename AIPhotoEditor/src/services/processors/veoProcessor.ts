import { BaseVideoProcessor } from './baseVideoProcessor';
import { KieAIService } from '../kieAIService';
import { VideoTransformResponse } from '../../types/video';
import { EditModeConfig } from '../../types/editModes';

/**
 * Veo 3.1 Processor
 * Generates high-fidelity, cinematic videos from text prompts
 */
export class VeoProcessor extends BaseVideoProcessor {
  async process(inputUri: string, config?: EditModeConfig): Promise<VideoTransformResponse> {
    // For text-to-video, inputUri might be empty or a placeholder image
    // The actual input is the text prompt
    const prompt = config?.prompt as string | undefined;
    
    if (!prompt || prompt.trim().length === 0) {
      return this.createErrorResponse('Prompt is required for video generation');
    }

    try {
      console.log('[VeoProcessor] Starting video generation with Veo 3.1');
      console.log('[VeoProcessor] Prompt:', prompt);

      const result = await KieAIService.generateVideoWithVeo(prompt, {
        duration: (config?.duration as number) || 5,
        aspectRatio: (config?.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
        quality: (config?.quality as 'high' | 'medium' | 'low') || 'high',
      });

      return result;
    } catch (error: any) {
      console.error('[VeoProcessor] Error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to generate video with Veo 3.1'
      );
    }
  }
}



