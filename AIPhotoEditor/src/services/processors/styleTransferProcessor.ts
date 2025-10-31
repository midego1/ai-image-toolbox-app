import { BaseProcessor } from './baseProcessor';
import { AIService, TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Style Transfer Processor
 * Applies artistic styles from a style image to a content image
 * Supports both style image selection and preset styles
 */
export class StyleTransferProcessor extends BaseProcessor {
  /**
   * Process style transfer
   * Config options:
   * - styleImageUri: URI of style reference image (preferred)
   * - stylePreset: Preset style name (fallback)
   * - styleStrength: 0.0 to 1.0 (default: 0.7)
   * - styleDescription: Custom style description text
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    try {
      console.log('[StyleTransferProcessor] Starting style transfer');
      
      const styleImageUri = config?.styleImageUri as string | undefined;
      const styleStrength = Math.max(0.0, Math.min(1.0, (config?.styleStrength as number) || 0.7));
      const stylePreset = config?.stylePreset as string | undefined;
      const styleDescription = config?.styleDescription as string | undefined;
      
      console.log('[StyleTransferProcessor] Config:', {
        hasStyleImage: !!styleImageUri,
        styleStrength,
        stylePreset,
        hasStyleDescription: !!styleDescription,
      });

      // Mode A: Style image provided (recommended - most flexible)
      if (styleImageUri && this.validateImageUri(styleImageUri)) {
        console.log('[StyleTransferProcessor] Using style image mode');
        const prompt = this.buildStyleImagePrompt(styleStrength);
        return await AIService.transformImages({
          imageUris: [imageUri, styleImageUri],
          prompt,
        });
      }

      // Mode B: Preset style (text-based)
      if (stylePreset) {
        console.log('[StyleTransferProcessor] Using preset style mode:', stylePreset);
        const prompt = this.buildStylePresetPrompt(stylePreset, styleStrength);
        return await AIService.transformImage(imageUri, prompt);
      }

      // Mode C: Custom style description
      if (styleDescription && styleDescription.trim()) {
        console.log('[StyleTransferProcessor] Using custom style description');
        const prompt = this.buildCustomStylePrompt(styleDescription.trim(), styleStrength);
        return await AIService.transformImage(imageUri, prompt);
      }

      return this.createErrorResponse('Please select a style image, preset, or describe the style');
    } catch (error: any) {
      console.error('[StyleTransferProcessor] Error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to apply style transfer'
      );
    }
  }

  /**
   * Build prompt for style image transfer (multi-image)
   */
  private buildStyleImagePrompt(strength: number): string {
    const strengthDesc = strength > 0.75 
      ? 'strongly' 
      : strength > 0.5 
      ? 'moderately' 
      : strength > 0.25
      ? 'subtly'
      : 'lightly';
    
    return `Apply the artistic style from image 2 to the content of image 1.

PRESERVE CONTENT FROM IMAGE 1:
- Maintain the exact subject, composition, and structure from image 1
- Keep recognizable features, poses, and details intact
- Preserve the original scene and layout
- Do not alter the fundamental content or narrative

APPLY STYLE FROM IMAGE 2 ${strengthDesc.toUpperCase()}:
- Blend colors, brush strokes, and texture characteristics from image 2
- Transfer artistic techniques and visual style elements
- Match the overall aesthetic and mood of the style image
- Apply stylistic patterns, line work, and rendering methods from image 2
- Style transfer intensity: ${Math.round(strength * 100)}%

BALANCE:
- Create a coherent artistic rendition that balances style and content
- Ensure the result looks like a unified artistic work, not a filter
- Blend edges naturally without visible seams or artifacts
- Maintain visual coherence throughout the image
- Output should feel like a deliberate artistic interpretation

TECHNICAL QUALITY:
- High resolution output with clean details
- Natural color blending without harsh transitions
- Preserve fine details where appropriate
- Professional artistic quality

FINAL OUTPUT:
An artistic interpretation of image 1 in the style of image 2, with ${Math.round(strength * 100)}% style transfer strength, maintaining content recognizability while applying distinctive stylistic elements.`;
  }

  /**
   * Build prompt for preset style (single image with text description)
   */
  private buildStylePresetPrompt(preset: string, strength: number): string {
    const strengthDesc = strength > 0.75 ? 'strongly' : strength > 0.5 ? 'moderately' : 'subtly';
    
    const styleDescriptions: Record<string, string> = {
      'van_gogh': 'Van Gogh\'s post-impressionist style with bold, swirling brushstrokes, vibrant colors, and expressive texture. Characteristic thick paint application and visible brush marks.',
      'picasso': 'Picasso\'s cubist style with geometric shapes, abstracted forms, and multiple perspectives. Bold lines and fragmented compositions.',
      'monet': 'Monet\'s impressionist style with soft, visible brushstrokes, emphasis on light and color, and loose, painterly technique. Focus on capturing the essence of light.',
      'watercolor': 'Watercolor painting style with soft edges, transparent layers, flowing pigments, and characteristic bleed effects. Delicate color washes and subtle gradients.',
      'oil_painting': 'Classic oil painting style with rich textures, layered brushwork, and depth. Traditional fine art technique with visible canvas texture.',
      'sketch': 'Pencil sketch style with line art, cross-hatching, and shading. Graphite drawing aesthetic with artistic detail.',
      'anime': 'Anime art style with clean lines, vibrant colors, and stylized proportions. Japanese animation aesthetic.',
      'pop_art': 'Pop art style with bold colors, high contrast, and graphic design elements. Warhol-inspired vibrant aesthetic.',
    };

    const styleDesc = styleDescriptions[preset] || preset;

    return `Apply ${styleDesc} ${strengthDesc} to this image.

PRESERVE CONTENT:
- Keep the original composition, subject matter, and structure exactly as shown
- Maintain recognizable features, poses, and details
- Preserve the scene and narrative elements

APPLY STYLE:
- Blend the ${styleDesc} aesthetic naturally
- Style intensity: ${Math.round(strength * 100)}%
- Ensure the artistic style feels integrated, not applied as a filter
- Create a coherent artistic interpretation

OUTPUT:
A high-quality artistic rendition that maintains content recognizability while applying ${styleDesc} at ${Math.round(strength * 100)}% strength.`;
  }

  /**
   * Build prompt for custom style description
   */
  private buildCustomStylePrompt(description: string, strength: number): string {
    const strengthDesc = strength > 0.75 ? 'strongly' : strength > 0.5 ? 'moderately' : 'subtly';
    
    return `Apply ${description} ${strengthDesc} to this image.

PRESERVE CONTENT:
- Maintain the exact subject, composition, and structure
- Keep recognizable features and details intact
- Preserve the original scene and layout

APPLY STYLE:
- Blend ${description} aesthetic elements naturally
- Style intensity: ${Math.round(strength * 100)}%
- Create a coherent artistic interpretation
- Ensure natural integration without visible artifacts

OUTPUT:
An artistic rendition with ${description} applied at ${Math.round(strength * 100)}% strength, maintaining content recognizability.`;
  }
}


