import { BaseProcessor } from './baseProcessor';
import { AIService, TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Ghiblify Processor
 * Transforms photos into Studio Ghibli animation style
 * Uses Nano Banana for single-step transformation
 */
export class GhiblifyProcessor extends BaseProcessor {
  /**
   * Process image into Studio Ghibli style
   * Simple, optimized prompt for Nano Banana
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    try {
      console.log('[GhiblifyProcessor] Starting Ghiblify transformation');
      
      const prompt = this.buildGhiblifyPrompt();
      return await AIService.transformImage(imageUri, prompt);
    } catch (error: any) {
      console.error('[GhiblifyProcessor] Error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to create Ghiblify transformation'
      );
    }
  }

  /**
   * Build optimized Ghiblify prompt for Nano Banana
   * Concise but effective prompt that captures Studio Ghibli aesthetic
   */
  private buildGhiblifyPrompt(): string {
    return `Transform this reference photo into Studio Ghibli animation style.

PRESERVE THE SUBJECT FROM REFERENCE:
- Facial features, expression, and identity match the reference photo exactly
- Hair color, style, and texture identical to reference
- Clothing colors, patterns, logos, and details match the reference photo precisely
- Body pose, gestures, and distinctive accessories preserved accurately
- Personal style and fashion choices maintained exactly
- All recognizable characteristics from reference maintained

APPLY STUDIO GHIBLI ANIMATION FILTER:
- Studio Ghibli character design: large expressive eyes, soft rounded facial features, natural realistic proportions
- Hand-painted animation aesthetic with visible brushstroke texture
- Clean, soft line work with subtle hand-drawn quality (not harsh or photorealistic)
- Soft, warm, muted color palette: earthy browns, ochre, terracotta, muted orange, warm greens, sky blues, natural skin tones, pastel accents
- Gentle lighting with soft shadows and natural illumination (no strong contrasts or harsh shadows)
- Whimsical, charming, warm character expression typical of Ghibli animation
- Professional animation cel painting quality with soft, subtle shading

BACKGROUND ENVIRONMENT:
- Detailed Studio Ghibli-style backgrounds: European-style towns with stone architecture and tiled roofs, or lush natural landscapes with dramatic skies and fluffy clouds
- Atmospheric depth with detailed background elements
- Idyllic, warm, inviting atmosphere with nostalgic feel
- Rich environmental details that complement the subject naturally

TECHNICAL QUALITY:
- Smooth color transitions and harmonious color relationships throughout
- High-resolution Studio Ghibli animation aesthetic
- Looks like an authentic Studio Ghibli animated film still
- Maintains photographic realism of the subject while applying Ghibli artistic transformation

FINAL OUTPUT:
A Studio Ghibli animation style image that accurately represents the subject from the reference photo with all distinctive features, clothing, personal style, and characteristics preserved, rendered with Studio Ghibli animation aesthetic, hand-painted quality, warm muted colors, and detailed backgrounds in authentic Studio Ghibli style.`;
  }
}

