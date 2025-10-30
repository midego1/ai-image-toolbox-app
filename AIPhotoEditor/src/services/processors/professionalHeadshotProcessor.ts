import { BaseProcessor } from './baseProcessor';
import { AIService, TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';

/**
 * Professional Headshot Processor
 * Uses Nano Banana for single-step professional headshot creation
 * Handles: face enhancement + background replacement + lighting + color grading
 */
export class ProfessionalHeadshotProcessor extends BaseProcessor {
  /**
   * Process professional headshot
   * Config options:
   * - headshotStyle: 'corporate' | 'creative' | 'casual' | 'executive'
   * - backgroundStyle: 'office' | 'studio' | 'outdoor' | 'neutral' | 'custom'
   * - backgroundImageUri: string (optional, for custom background)
   * - lightingStyle: 'professional' | 'soft' | 'dramatic' | 'natural'
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    const headshotStyle = (config?.headshotStyle as string) || 'corporate';
    const backgroundStyle = (config?.backgroundStyle as string) || 'neutral';
    const backgroundImageUri = config?.backgroundImageUri as string | undefined;
    const lightingStyle = (config?.lightingStyle as string) || 'professional';

    try {
      console.log('[ProfessionalHeadshotProcessor] Starting processing');
      console.log('[ProfessionalHeadshotProcessor] Style:', headshotStyle);
      console.log('[ProfessionalHeadshotProcessor] Background:', backgroundStyle);
      console.log('[ProfessionalHeadshotProcessor] Lighting:', lightingStyle);

      // If custom background provided, use multi-image mode (like Replace Background)
      if (backgroundImageUri && this.validateImageUri(backgroundImageUri)) {
        console.log('[ProfessionalHeadshotProcessor] Using custom background image');
        const prompt = this.buildHeadshotPromptWithCustomBackground(
          headshotStyle,
          lightingStyle
        );
        return await AIService.transformImages({
          imageUris: [imageUri, backgroundImageUri],
          prompt,
        });
      }

      // Single image mode with text-based background
      console.log('[ProfessionalHeadshotProcessor] Using text-based background');
      const prompt = this.buildHeadshotPrompt(
        headshotStyle,
        backgroundStyle,
        lightingStyle
      );
      return await AIService.transformImage(imageUri, prompt);
    } catch (error: any) {
      console.error('ProfessionalHeadshotProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to process professional headshot'
      );
    }
  }

  /**
   * Build comprehensive professional headshot prompt (single image mode)
   * Similar structure to Virtual Try-On's detailed step-by-step approach
   */
  private buildHeadshotPrompt(
    headshotStyle: string,
    backgroundStyle: string,
    lightingStyle: string
  ): string {
    const styleInstructions: Record<string, string> = {
      corporate: 'Corporate professional portrait style: polished appearance, subtle rim lighting, even skin tones, professional color grading suitable for LinkedIn and business profiles',
      creative: 'Creative professional portrait style: dynamic lighting with depth, vibrant but natural colors, artistic color grading, engaging professional appearance',
      casual: 'Casual professional portrait style: natural soft lighting, warm tones, relaxed professional appearance, approachable and friendly',
      executive: 'Executive portrait style: sophisticated lighting with depth, refined color grading, authoritative yet approachable, high-end professional appearance',
    };

    const backgroundPrompts: Record<string, string> = {
      office: 'modern professional office background with neutral colors, subtle blurred bokeh effect, clean corporate environment, professional setting',
      studio: 'professional photography studio background with neutral gray or white, even soft lighting, clean minimal environment, portrait photography setting',
      outdoor: 'professional outdoor portrait background with natural setting, subtle depth and perspective, blurred natural background, outdoor professional photography',
      neutral: 'neutral professional background with solid color or subtle gradient, clean minimal environment, portrait photography background',
    };

    const lightingInstructions: Record<string, string> = {
      professional: 'Professional studio lighting with subtle rim light around face, even skin illumination, professional color balance, polished appearance',
      soft: 'Soft diffused lighting with gentle highlights on face, smooth natural skin tones, warm professional color grading',
      dramatic: 'Dramatic professional lighting with depth and contrast, well-defined facial features, professional color grading with subtle dramatic flair',
      natural: 'Natural-looking professional lighting that mimics studio daylight, authentic appearance, minimal but professional color grading',
    };

    const styleInstruction = styleInstructions[headshotStyle] || styleInstructions.corporate;
    const backgroundPrompt = backgroundPrompts[backgroundStyle] || backgroundPrompts.neutral;
    const lightingInstruction = lightingInstructions[lightingStyle] || lightingInstructions.professional;

    return `Transform this image into a high-quality professional headshot suitable for LinkedIn, resumes, and business profiles.

STEP 1 - PRESERVE THE PERSON:
The person in the image must remain completely unchanged:
- Their face, facial features, identity, and expression stay exactly the same
- Their body pose, stance, and position remain as shown
- Their clothing and appearance are preserved
- Their hair, hairstyle, and hair color look identical
- Maintain natural skin texture - no over-smoothing or plastic appearance

STEP 2 - FACE ENHANCEMENT:
Enhance the face quality while preserving identity:
- Reduce minor blemishes and imperfections naturally
- Improve facial clarity and sharpness
- Enhance skin tone uniformity while keeping it natural
- Brighten eyes subtly for a professional look
- Ensure facial features remain authentic and recognizable

STEP 3 - BACKGROUND REPLACEMENT:
Replace the background with: ${backgroundPrompt}

Background requirements:
- Keep the person's edges clean, especially around hair and semi-transparent areas
- Match lighting and shadows to the new professional background
- Ensure seamless integration - looks like person was photographed in this setting
- Maintain professional appearance suitable for business use

STEP 4 - LIGHTING & COLOR GRADING:
Apply professional portrait lighting and color grading:
- ${lightingInstruction}
- ${styleInstruction}
- Enhance facial features with subtle rim lighting for depth
- Apply professional color grading appropriate for corporate/business use
- Adjust white balance for professional appearance
- Add subtle depth and dimension through lighting
- Ensure consistent professional lighting throughout

FINAL OUTPUT REQUIREMENTS:
- LinkedIn-quality professional headshot
- Looks like taken by professional photographer in studio or professional setting
- High resolution and sharp
- Professional color grading and polished appearance
- Suitable for business profiles, resumes, and corporate use
- No visible artifacts, distortions, or unnatural effects
- Photorealistic and professional throughout

The result must show a professional headshot where the person looks exactly the same, but with enhanced quality, professional background, and polished lighting suitable for business use.`;
  }

  /**
   * Build prompt for custom background (multi-image mode)
   */
  private buildHeadshotPromptWithCustomBackground(
    headshotStyle: string,
    lightingStyle: string
  ): string {
    const styleInstructions: Record<string, string> = {
      corporate: 'Corporate professional portrait style: polished appearance, subtle rim lighting, even skin tones, professional color grading',
      creative: 'Creative professional portrait style: dynamic lighting with depth, vibrant but natural colors, artistic color grading',
      casual: 'Casual professional portrait style: natural soft lighting, warm tones, relaxed professional appearance',
      executive: 'Executive portrait style: sophisticated lighting with depth, refined color grading, high-end professional appearance',
    };

    const lightingInstructions: Record<string, string> = {
      professional: 'Professional studio lighting with subtle rim light, even skin illumination, professional color balance',
      soft: 'Soft diffused lighting with gentle highlights, smooth skin tones, warm color grading',
      dramatic: 'Dramatic lighting with depth and contrast, defined features, professional color grading',
      natural: 'Natural-looking professional lighting, authentic appearance, minimal color grading',
    };

    const styleInstruction = styleInstructions[headshotStyle] || styleInstructions.corporate;
    const lightingInstruction = lightingInstructions[lightingStyle] || lightingInstructions.professional;

    return `Transform image 1 into a professional headshot by placing the person onto the professional background from image 2.

STEP 1 - PRESERVE THE PERSON FROM IMAGE 1:
- Face, identity, expression, and features stay exactly the same
- Body pose and stance remain unchanged
- Clothing and appearance preserved
- Hair, hairstyle, and hair color look identical
- Natural skin texture preserved (no over-smoothing)

STEP 2 - FACE ENHANCEMENT:
While preserving identity:
- Reduce minor blemishes naturally
- Improve facial clarity
- Enhance skin tone uniformity
- Brighten eyes subtly

STEP 3 - BACKGROUND INTEGRATION:
Place the person from image 1 onto the background from image 2:
- Clean edges around person, especially hair
- Match lighting and shadows to background in image 2
- Seamless integration - looks like photographed in this setting
- Professional appearance

STEP 4 - LIGHTING & COLOR GRADING:
- ${lightingInstruction}
- ${styleInstruction}
- Subtle rim lighting for depth
- Professional color grading
- Consistent professional lighting

FINAL OUTPUT: LinkedIn-quality professional headshot with person from image 1 on background from image 2, with enhanced face quality and professional lighting.`;
  }
}

