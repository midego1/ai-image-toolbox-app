import { BaseProcessor } from './baseProcessor';
import { AIService, TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Replace Background Processor
 * Minimal viable version:
 * - If backgroundImageUri provided: use multi-image composition [original, background]
 * - Else if backgroundPrompt provided: use single-image with background prompt
 */
export class ReplaceBackgroundProcessor extends BaseProcessor {
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    const backgroundImageUri = (config?.backgroundImageUri as string) || '';
    const backgroundPromptRaw = (config?.backgroundPrompt as string) || '';

    if (!backgroundImageUri && !backgroundPromptRaw.trim()) {
      return this.createErrorResponse('Please provide a background description or select a background image');
    }

    try {
      // Mode A: Use user-provided background image for composition
      if (backgroundImageUri) {
        if (!this.validateImageUri(backgroundImageUri)) {
          return this.createErrorResponse('Invalid background image provided');
        }

        const prompt = this.buildBackgroundImageCompositionPrompt();
        return await AIService.transformImages({
          imageUris: [imageUri, backgroundImageUri],
          prompt,
        });
      }

      // Mode B: Use a text prompt to generate/replace the background
      const enhancedPrompt = this.buildBackgroundTextPrompt(backgroundPromptRaw.trim());
      return await AIService.transformImage(imageUri, enhancedPrompt);
    } catch (error: any) {
      return this.createErrorResponse(error?.message || 'Failed to replace background');
    }
  }

  private buildBackgroundImageCompositionPrompt(): string {
    return [
      'Replace the background by placing the main subject from image 1 onto the background from image 2.',
      'Keep the subject from image 1 exactly the same (identity, pose, lighting).',
      'Integrate naturally: match lighting, perspective, and shadows to the new scene.',
      'Avoid halos or cutout artifacts; blend edges (hair, transparent areas) cleanly.',
      'Final output: photorealistic composite that looks like the subject was shot in the scene from image 2.',
    ].join(' ');
  }

  private buildBackgroundTextPrompt(userPrompt: string): string {
    return [
      `Replace the background with: ${userPrompt}.`,
      'Keep the main subject exactly the same (identity, pose, clothing, details).',
      'Recreate realistic lighting, shadows, and reflections that match the new background.',
      'Ensure clean edges (including hair and semi-transparent areas).',
      'Photorealistic result with natural integration and no visible artifacts.',
    ].join(' ');
  }
}




