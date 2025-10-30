import { BaseProcessor } from './baseProcessor';
import { AIService, MultiImageTransformParams } from '../aiService';
import { TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
import { ClothingType } from '../../constants/clothingTypes';

export interface ClothingItem {
  uri: string;
  type: ClothingType;
}

/**
 * Virtual Try-On Processor
 * Combines person image with one or more clothing items using multi-image composition
 */
export class VirtualTryOnProcessor extends BaseProcessor {
  /**
   * Process virtual try-on with person and clothing images
   * Supports both single item (legacy) and multiple items (new) formats
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid person image URI provided');
    }

    // Extract clothing items - support both new array format and legacy single item format
    const clothingItems = config?.clothingItems as ClothingItem[] | undefined;
    const clothingImageUri = config?.clothingImageUri as string | undefined; // Legacy support
    
    const fitStyle = (config?.fitStyle as string) || 'natural';
    const preserveBackground = (config?.preserveBackground as boolean) ?? true;

    // Convert legacy format to new format if needed
    let items: ClothingItem[] = [];
    if (clothingItems && clothingItems.length > 0) {
      items = clothingItems;
    } else if (clothingImageUri) {
      // Legacy: single item without type
      items = [{ uri: clothingImageUri, type: ClothingType.OTHER }];
    }

    if (items.length === 0) {
      return this.createErrorResponse('At least one clothing item is required for virtual try-on');
    }

    // Validate all clothing image URIs
    for (const item of items) {
      if (!this.validateImageUri(item.uri)) {
        return this.createErrorResponse(`Invalid clothing image URI provided: ${item.type}`);
      }
    }

    try {
      console.log('[VirtualTryOnProcessor] Starting virtual try-on processing');
      console.log('[VirtualTryOnProcessor] Person image:', imageUri);
      console.log('[VirtualTryOnProcessor] Clothing items count:', items.length);
      
      // Create optimized prompt for virtual try-on
      const prompt = this.buildTryOnPrompt(items, fitStyle, preserveBackground);
      console.log('[VirtualTryOnProcessor] Prompt length:', prompt.length);

      // Build image array: person first, then clothing items in order
      const imageUris = [imageUri, ...items.map(item => item.uri)];
      console.log('[VirtualTryOnProcessor] Total images:', imageUris.length);

      // Use multi-image transform
      const params: MultiImageTransformParams = {
        imageUris: imageUris,
        prompt: prompt,
      };

      console.log('[VirtualTryOnProcessor] Calling AIService.transformImages...');
      const result = await AIService.transformImages(params);
      console.log('[VirtualTryOnProcessor] AIService.transformImages returned:', {
        success: result.success,
        hasImageUri: !!result.imageUri,
        error: result.error
      });
      return result;
    } catch (error: any) {
      console.error('VirtualTryOnProcessor error:', error);
      return this.createErrorResponse(
        error.message || 'Failed to process virtual try-on'
      );
    }
  }

  /**
   * Build optimized prompt for virtual try-on (optimized for Gemini Nano Banana)
   * Supports multiple clothing items with types
   */
  private buildTryOnPrompt(clothingItems: ClothingItem[], fitStyle: string, preserveBackground: boolean): string {
    const backgroundInstruction = preserveBackground
      ? 'Keep the exact same background, scene environment, and all background elements exactly as they appear in image 1. The background must remain completely unchanged.'
      : 'Generate a complementary background that enhances the outfit.';

    const fitInstructions: Record<string, string> = {
      natural: 'The clothing should fit naturally with realistic fabric drape that follows the person\'s body contours and current pose. Show natural folds and wrinkles.',
      loose: 'Apply the clothing with a relaxed, comfortable loose fit. The fabric should drape naturally with extra volume and space.',
      fitted: 'Apply the clothing with a tailored, fitted appearance. Show a sleek silhouette with minimal excess fabric.',
    };

    // Build clothing items description based on types and image positions
    const isMultipleItems = clothingItems.length > 1;
    let clothingInstructions = '';
    
    if (isMultipleItems) {
      // Multiple items - create a complete outfit
      const itemDescriptions = clothingItems.map((item, index) => {
        const imageNumber = index + 2; // Image 1 is person, so clothing starts at 2
        const typeName = this.getClothingTypeName(item.type);
        return `- Image ${imageNumber}: ${typeName} - Apply this ${typeName.toLowerCase()} as part of the complete outfit`;
      }).join('\n');
      
      clothingInstructions = `You are creating a complete virtual outfit try-on. Apply all clothing items from images 2-${clothingItems.length + 1} onto the person in image 1, creating a complete coordinated outfit.

CLOTHING ITEMS TO APPLY:
${itemDescriptions}

IMPORTANT LAYERING: Apply clothing items in proper order. Inner layers (like shirts) should be visible under outer layers (like jackets). Shoes should be placed at the feet, and accessories should be positioned appropriately.`;
    } else {
      // Single item
      const item = clothingItems[0];
      const typeName = this.getClothingTypeName(item.type);
      clothingInstructions = `You are creating a virtual clothing try-on. Apply the ${typeName.toLowerCase()} from image 2 onto the person in image 1.`;
    }

    return `${clothingInstructions}

TASK: Place the clothing item(s) from the subsequent images onto the person in image 1. Only modify the clothing visible on the person. Everything else must remain identical to image 1.

STEP 1 - PRESERVE EVERYTHING FROM IMAGE 1:
The person in image 1 must remain completely unchanged except for the clothing:
- Their face, facial features, expression, and identity stay exactly the same
- Their body shape, proportions, and structure are preserved completely  
- Their pose, stance, arm positions, leg positions remain exactly as shown
- Their hair, hairstyle, hair color look identical to the original
- All lighting, shadows, highlights, and illumination match image 1 precisely
- The camera angle, perspective, and photo composition are unchanged
- The background shows the same scene, objects, furniture, and elements
- The overall atmosphere, mood, and aesthetic match image 1

STEP 2 - APPLY CLOTHING ITEMS:
${isMultipleItems 
  ? clothingItems.map((item, index) => {
      const imageNumber = index + 2;
      const typeName = this.getClothingTypeName(item.type);
      return `Take the ${typeName.toLowerCase()} from image ${imageNumber} and apply it:
- Position it correctly: ${this.getPositioningHint(item.type)}
- ${fitInstructions[fitStyle] || fitInstructions.natural}
- Replicate the exact fabric texture, patterns, colors, and design details from image ${imageNumber}
- Match the clothing's lighting and shadows to the existing lighting in image 1`;
    }).join('\n\n')
  : `Take the clothing item from image 2 and apply it to the person:
- ${fitInstructions[fitStyle] || fitInstructions.natural}
- Replicate the exact fabric texture, patterns, colors, and design details from image 2`
}
- Create realistic fabric behavior: natural folds, creases, and wrinkles that respect physics
- The clothing should fit the person's body type and complement their current pose
- ${isMultipleItems ? 'Ensure all items work together as a coordinated outfit with proper layering' : 'Integrate the clothing seamlessly so it looks natural in the original scene'}

STEP 3 - FINAL OUTPUT:
- ${backgroundInstruction}
- Generate a photorealistic result with no visual artifacts or distortions
- Maintain the same photographic quality and style as image 1
- The final image should appear as if the person was photographed wearing ${isMultipleItems ? 'this complete outfit' : 'this clothing'} in the exact same setting, pose, and lighting conditions

The result must show only the clothing changed - the person, pose, scene, lighting, and everything else looks identical to image 1.`;
  }

  /**
   * Get human-readable clothing type name
   */
  private getClothingTypeName(type: ClothingType): string {
    const names: Record<ClothingType, string> = {
      [ClothingType.SHIRT]: 'Shirt/Top',
      [ClothingType.PANTS]: 'Pants/Jeans',
      [ClothingType.DRESS]: 'Dress',
      [ClothingType.JACKET]: 'Jacket/Coat',
      [ClothingType.SHOES]: 'Shoes',
      [ClothingType.SKIRT]: 'Skirt',
      [ClothingType.SHORTS]: 'Shorts',
      [ClothingType.SWEATER]: 'Sweater',
      [ClothingType.ACCESSORY]: 'Accessory',
      [ClothingType.OTHER]: 'Clothing item',
    };
    return names[type] || 'Clothing item';
  }

  /**
   * Get positioning hint based on clothing type
   */
  private getPositioningHint(type: ClothingType): string {
    const hints: Record<ClothingType, string> = {
      [ClothingType.SHIRT]: 'upper body, covering the torso and arms',
      [ClothingType.PANTS]: 'lower body, covering the legs from waist to ankles',
      [ClothingType.DRESS]: 'covering both upper and lower body as a single piece',
      [ClothingType.JACKET]: 'outer layer over other clothing, covering upper body',
      [ClothingType.SHOES]: 'at the feet, covering the feet and ankles',
      [ClothingType.SKIRT]: 'lower body, covering from waist down',
      [ClothingType.SHORTS]: 'lower body, covering from waist to above the knees',
      [ClothingType.SWEATER]: 'upper body, covering the torso and arms',
      [ClothingType.ACCESSORY]: 'positioned appropriately (hat on head, bag on shoulder, etc.)',
      [ClothingType.OTHER]: 'positioned on the appropriate body part',
    };
    return hints[type] || 'positioned appropriately';
  }
}

