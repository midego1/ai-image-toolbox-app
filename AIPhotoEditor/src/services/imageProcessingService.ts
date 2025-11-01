import { EditMode, EditModeConfig } from '../types/editModes';
import { TransformResponse } from './aiService';
import { BaseProcessor } from './processors/baseProcessor';
import { TransformProcessor } from './processors/transformProcessor';
import { BackgroundRemovalProcessor } from './processors/backgroundRemovalProcessor';
import { VirtualTryOnProcessor } from './processors/virtualTryOnProcessor';
import { ObjectRemovalProcessor } from './processors/objectRemovalProcessor';
import { ReplaceBackgroundProcessor } from './processors/replaceBackgroundProcessor';
import { ProfessionalHeadshotProcessor } from './processors/professionalHeadshotProcessor';
import { PopFigureProcessor } from './processors/popFigureProcessor';
import { PixelArtGamerProcessor } from './processors/pixelArtGamerProcessor';
import { StyleTransferProcessor } from './processors/styleTransferProcessor';
import { GhiblifyProcessor } from './processors/ghiblifyProcessor';
import { UpscaleProcessor } from './processors/upscaleProcessor';
import { EnhanceProcessor } from './processors/enhanceProcessor';

/**
 * Image Processing Service
 * Main router that delegates to appropriate processor based on edit mode
 */
export class ImageProcessingService {
  private static processors: Map<EditMode, BaseProcessor> = new Map();

  /**
   * Initialize processors (lazy initialization)
   */
  private static initializeProcessors(): void {
    if (this.processors.size === 0) {
      this.processors.set(EditMode.TRANSFORM, new TransformProcessor());
      this.processors.set(EditMode.REMOVE_BACKGROUND, new BackgroundRemovalProcessor());
      this.processors.set(EditMode.VIRTUAL_TRY_ON, new VirtualTryOnProcessor());
      this.processors.set(EditMode.REMOVE_OBJECT, new ObjectRemovalProcessor());
      this.processors.set(EditMode.REPLACE_BACKGROUND, new ReplaceBackgroundProcessor());
      this.processors.set(EditMode.PROFESSIONAL_HEADSHOTS, new ProfessionalHeadshotProcessor());
      this.processors.set(EditMode.POP_FIGURE, new PopFigureProcessor());
      this.processors.set(EditMode.PIXEL_ART_GAMER, new PixelArtGamerProcessor());
      this.processors.set(EditMode.STYLE_TRANSFER, new StyleTransferProcessor());
      this.processors.set(EditMode.GHIBLIFY, new GhiblifyProcessor());
      this.processors.set(EditMode.UPSCALE, new UpscaleProcessor());
      this.processors.set(EditMode.ENHANCE, new EnhanceProcessor());
      // Add more processors as they are implemented
      // this.processors.set(EditMode.FILTERS, new FilterProcessor());
    }
  }

  /**
   * Process an image based on edit mode
   * @param imageUri - URI of the image to process
   * @param editMode - The edit mode to apply
   * @param config - Optional configuration for the processor
   * @returns TransformResponse with processed image
   */
  static async processImage(
    imageUri: string,
    editMode: EditMode,
    config?: EditModeConfig
  ): Promise<TransformResponse> {
    this.initializeProcessors();

    const processor = this.processors.get(editMode);
    
    if (!processor) {
      return {
        success: false,
        error: `Processor not available for edit mode: ${editMode}. This feature may not be implemented yet.`,
      };
    }

    try {
      console.log(`[ImageProcessingService] Processing ${editMode}...`);
      const result = await processor.process(imageUri, config);
      console.log(`[ImageProcessingService] Processor returned:`, {
        success: result.success,
        hasImageUri: !!result.imageUri,
        error: result.error
      });
      return result;
    } catch (error: any) {
      console.error(`[ImageProcessingService] Error for ${editMode}:`, error);
      return {
        success: false,
        error: error.message || 'Failed to process image',
      };
    }
  }

  /**
   * Check if an edit mode is supported
   */
  static isModeSupported(editMode: EditMode): boolean {
    this.initializeProcessors();
    return this.processors.has(editMode);
  }

  /**
   * Get available edit modes
   */
  static getAvailableModes(): EditMode[] {
    this.initializeProcessors();
    return Array.from(this.processors.keys());
  }
}

