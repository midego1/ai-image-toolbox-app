import { BaseProcessor } from './baseProcessor';
import { AIService, TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Pop Figure Processor
 * Creates a detailed 3D render of a chibi pop figure based on reference photo
 * Uses Nano Banana for single-step pop figure transformation
 */
export class PopFigureProcessor extends BaseProcessor {
  /**
   * Process image into pop figure
   * Config options:
   * - includeBox: boolean (default: true) - Whether to render the figure inside a collectible box
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    const includeBox = config?.includeBox !== false; // Default to true if not specified

    try {
      console.log('[PopFigureProcessor] Starting Pop Figure transformation');
      console.log('[PopFigureProcessor] Include box:', includeBox);
      
      const prompt = this.buildPopFigurePrompt(includeBox);
      return await AIService.transformImage(imageUri, prompt);
    } catch (error: any) {
      console.error('PopFigureProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to create Pop Figure'
      );
    }
  }

  /**
   * Build optimized Pop Figure prompt for Nano Banana
   * Streamlined structure based on successful patterns from other processors
   * Conditionally includes box packaging based on user preference
   * Emphasizes professional studio photography presentation
   * Note: Keeps "Funko Pop" branding in the prompt for accurate AI results
   */
  private buildPopFigurePrompt(includeBox: boolean): string {
    const boxSection = includeBox ? `
COLLECTIBLE BOX PACKAGING:
- Display the figure inside a fun, vibrant collectible box
- Box design: transparent plastic front window, rectangular box shape with rounded corners, colorful and playful design
- Box shows the figure prominently through the clear plastic front panel
- Fun, playful box styling with vibrant colors, stars, sparkles, or other cheerful decorative elements
- Figure positioned inside box as if ready for display in a collectible store
- Box design should be fun and colorful - use vibrant colors, playful patterns, stars, sparkles, or other cheerful decorative elements
- NO brand names, logos, or text on the box - keep it fun and generic
- Box can be opened (figure visible through transparent window) or closed presentation` : '';

    const outputDescription = includeBox 
      ? 'A detailed 3D render of a chibi Funko Pop figure displayed inside a fun, vibrant collectible box'
      : 'A detailed 3D render of a chibi Funko Pop figure';

    const finalOutput = includeBox
      ? 'The figure should appear as a professional collectible product ready for display, with authentic Funko Pop proportions, styling, fun colorful packaging, and professional studio photography presentation quality.'
      : 'The figure should appear as a professional collectible product ready for display, with authentic Funko Pop proportions, styling, and professional studio photography presentation quality.';

    return `Transform this reference photo into a detailed 3D render of a chibi Funko Pop figure${includeBox ? ' displayed inside a fun collectible box' : ''}.

PRESERVE THE SUBJECT FROM REFERENCE:
- Facial features, expression, and identity match the reference photo exactly
- Hair color, style, and texture identical to reference  
- Clothing colors, patterns, logos match the reference photo precisely
- Body pose and distinctive accessories preserved accurately
- All recognizable characteristics from reference maintained

APPLY FUNKO POP STYLIZATION:
- Oversized head with 2:1 head-to-body ratio (classic Funko Pop proportion)
- Large round expressive eyes in Funko Pop style
- Small compact body with stubby limbs
- Smooth, rounded rectangular head shape (signature Funko Pop silhouette)
- Matte toy-like finish (not glossy or reflective)
- Simplified but recognizable facial features
${boxSection}
PROFESSIONAL STUDIO PHOTOGRAPHY PRESENTATION:
- Professional studio photography setup: figure placed on a clean, elegant surface in a photography studio
- Premium photography surface: glossy reflective surface, marble texture, or professional photography backdrop
- Studio lighting setup: soft, professional key lighting with subtle rim lighting and fill lights
- Beautiful reflections and highlights on the surface showing professional studio photography quality
- Clean, minimal studio environment that makes the figure shine and stand out
- Professional product photography style: camera angle optimized to showcase the figure beautifully
- The figure should look like it's being professionally photographed in a high-end studio setting
- Premium presentation that makes the collectible look valuable and well-crafted

3D RENDER QUALITY:
- Professional 3D render with studio product photography lighting
- Soft diffused lighting from front and sides (like Funko Pop official product photos)
- Beautiful surface reflections and highlights that enhance the professional studio look
- Clean sharp edges with no artifacts or distortions
- High-resolution detail while maintaining toy aesthetic
- Photorealistic rendering of a collectible figure${includeBox ? ' in fun colorful packaging' : ''} on a beautiful studio surface

COLOR & DETAIL MATCHING:
- All colors from reference photo matched exactly (clothing, skin, hair)
- Preserve logos, patterns, and distinctive design elements
- Maintain overall color palette and visual characteristics

FINAL OUTPUT:
${outputDescription}, accurately representing the subject from the reference photo, professionally photographed in a beautiful studio setting on an elegant surface with perfect lighting. ${finalOutput}`;
  }
}

