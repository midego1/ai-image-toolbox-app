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
   * - backgroundType: 'studio' | 'marble' | 'glossy' | 'simple' | 'color' (default: 'studio') - Type of background surface
   * - backgroundColor: string (optional) - Custom background color in hex format (e.g., '#FFFFFF')
   * - isTransparent: boolean (default: false) - Whether the background should be transparent
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    const includeBox = config?.includeBox !== false; // Default to true if not specified
    const backgroundType = (config?.backgroundType as string) || 'studio';
    const backgroundColor = (config?.backgroundColor as string) || '#FFFFFF';
    const isTransparent = config?.isTransparent === true;

    try {
      console.log('[PopFigureProcessor] Starting Pop Figure transformation');
      console.log('[PopFigureProcessor] Include box:', includeBox);
      console.log('[PopFigureProcessor] Background type:', backgroundType);
      console.log('[PopFigureProcessor] Background color:', backgroundColor);
      console.log('[PopFigureProcessor] Is transparent:', isTransparent);
      
      const prompt = this.buildPopFigurePrompt(includeBox, backgroundType, backgroundColor, isTransparent);
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
  private buildPopFigurePrompt(includeBox: boolean, backgroundType: string, backgroundColor: string, isTransparent: boolean): string {
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

    const backgroundPrompts: Record<string, string> = {
      studio: 'Professional studio photography backdrop: clean, minimal studio environment with neutral gray or white background, even soft lighting, professional photography setting that makes the figure shine and stand out',
      marble: 'Premium marble texture surface: elegant marble surface with natural stone texture, beautiful veining patterns, glossy reflective finish, luxurious high-end presentation that makes the collectible look valuable',
      glossy: 'Glossy reflective surface: polished glossy reflective surface with mirror-like finish, beautiful reflections and highlights, premium product photography quality, professional studio lighting setup',
      simple: 'Simple clean background: minimal clean background with subtle neutral tones, uncluttered presentation, focus on the figure, professional product photography style',
      color: isTransparent 
        ? 'Transparent background: completely transparent background with no visible surface or backdrop, figure stands alone with no background elements, perfect for digital use and compositing'
        : `Solid color background: clean solid color background in ${backgroundColor}, professional product photography style, figure stands out clearly against the ${backgroundColor} background`,
    };

    const backgroundPrompt = backgroundPrompts[backgroundType] || backgroundPrompts.studio;

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
- Background: ${backgroundPrompt}
- Studio lighting setup: soft, professional key lighting with subtle rim lighting and fill lights
- Beautiful reflections and highlights on the surface showing professional studio photography quality
- Professional product photography style: camera angle optimized to showcase the figure beautifully
- The figure should look like it's being professionally photographed in a high-end studio setting
- Premium presentation that makes the collectible look valuable and well-crafted

3D RENDER QUALITY:
- Professional 3D render with studio product photography lighting
- Soft diffused lighting from front and sides (like Funko Pop official product photos)
- Beautiful surface reflections and highlights that enhance the professional studio look
- Clean sharp edges with no artifacts or distortions
- High-resolution detail while maintaining toy aesthetic
- Photorealistic rendering of a collectible figure${includeBox ? ' in fun colorful packaging' : ''} on ${backgroundType === 'studio' ? 'a beautiful studio surface' : backgroundType === 'marble' ? 'an elegant marble surface' : backgroundType === 'glossy' ? 'a glossy reflective surface' : backgroundType === 'color' ? (isTransparent ? 'a transparent background' : `a solid ${backgroundColor} background`) : 'a clean simple background'}

COLOR & DETAIL MATCHING:
- All colors from reference photo matched exactly (clothing, skin, hair)
- Preserve logos, patterns, and distinctive design elements
- Maintain overall color palette and visual characteristics

FINAL OUTPUT:
${outputDescription}, accurately representing the subject from the reference photo, professionally photographed in a beautiful studio setting on an elegant surface with perfect lighting. ${finalOutput}`;
  }
}


