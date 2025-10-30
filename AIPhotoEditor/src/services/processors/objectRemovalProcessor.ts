import { BaseProcessor } from './baseProcessor';
import { TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Object Removal Processor
 * Uses Replicate's inpainting models to remove objects based on text prompts
 */
export class ObjectRemovalProcessor extends BaseProcessor {
  private static REPLICATE_API_KEY_STORAGE = 'replicate_api_key';
  private static REPLICATE_API_KEY_FALLBACK = 'YOUR_REPLICATE_API_KEY';
  // Using nano-banana (Gemini 2.5 Flash) for object removal - same reliable model as transform
  // This model supports image + prompt for editing tasks
  private static REMOVAL_MODEL = 'google/nano-banana';
  private static REMOVAL_MODEL_VERSION = '2c8a3b5b81554aa195bde461e2caa6afacd69a66c48a64fb0e650c9789f8b8a0';

  private async getReplicateApiKey(): Promise<string> {
    try {
      const storedKey = await SecureStore.getItemAsync(ObjectRemovalProcessor.REPLICATE_API_KEY_STORAGE);
      if (storedKey) return storedKey;
    } catch (error) {
      console.warn('Could not retrieve Replicate API key from secure storage');
    }
    return ObjectRemovalProcessor.REPLICATE_API_KEY_FALLBACK;
  }

  /**
   * Process object removal based on prompt
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    const prompt = config?.prompt || config?.removalPrompt || '';
    if (!prompt || prompt.trim().length === 0) {
      return this.createErrorResponse('Please provide a description of what to remove');
    }

    try {
      const apiKey = await this.getReplicateApiKey();
      
      if (!apiKey || apiKey === ObjectRemovalProcessor.REPLICATE_API_KEY_FALLBACK) {
        return this.createErrorResponse(
          'Replicate API key not configured. Please set your API key.'
        );
      }

      // Read image as base64
      let base64: string;
      
      if (imageUri.startsWith('data:')) {
        const parts = imageUri.split(',');
        if (parts.length < 2 || !parts[1]) {
          return this.createErrorResponse('Invalid data URI format');
        }
        base64 = parts[1];
      } else if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        // Remote URL - download and convert
        try {
          const tempUri = `${FileSystem.cacheDirectory}temp_obj_${Date.now()}.jpg`;
          const downloadResult = await FileSystem.downloadAsync(imageUri, tempUri);
          
          if (!downloadResult.uri) {
            return this.createErrorResponse('Failed to download image from URL');
          }
          
          base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
            encoding: 'base64'
          });
          
          // Clean up temp file
          try {
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        } catch (fetchError: any) {
          console.error('Error downloading/reading remote image:', fetchError);
          return this.createErrorResponse('Failed to load image from URL: ' + (fetchError?.message || 'Unknown error'));
        }
      } else {
        // Local file
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) {
            return this.createErrorResponse('Image file does not exist');
          }
          
          base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64'
          });
        } catch (fileError: any) {
          return this.createErrorResponse('Failed to read image file');
        }
      }

      // Use same format as Transform (AIService) - always JPEG for consistency
      const imageDataUri = `data:image/jpeg;base64,${base64}`;

      // Use nano-banana model (same as transform) - reliable and works well
      // Format the prompt for object removal - use user's prompt directly
      const cleanPrompt = prompt.trim();
      const removalPrompt = cleanPrompt.toLowerCase().startsWith('remove ')
        ? `${cleanPrompt.substring(7).trim()} from the image. Keep everything else intact and natural looking.`
        : `Remove ${cleanPrompt} from the image. Keep everything else intact and natural looking.`;

      // Build request body - exactly same format as Transform processor
      const requestBody = {
        version: ObjectRemovalProcessor.REMOVAL_MODEL_VERSION,
        input: {
          prompt: removalPrompt,
          image_input: [imageDataUri],
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
        }
      };

      console.log('[ObjectRemovalProcessor] Sending request to Replicate API...');
      console.log('[ObjectRemovalProcessor] Model:', ObjectRemovalProcessor.REMOVAL_MODEL);
      console.log('[ObjectRemovalProcessor] Version:', ObjectRemovalProcessor.REMOVAL_MODEL_VERSION);

      const predictionResponse = await axios.post(
        'https://api.replicate.com/v1/predictions',
        requestBody,
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (!predictionResponse.data?.id) {
        console.error('[ObjectRemovalProcessor] No prediction ID in response:', predictionResponse.data);
        return this.createErrorResponse(
          predictionResponse.data?.error || 'Failed to start prediction'
        );
      }

      const predictionId = predictionResponse.data.id;
      console.log('[ObjectRemovalProcessor] Prediction started:', predictionId);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });

        const status = statusResponse.data.status;
        
        if (status === 'succeeded') {
          const output = statusResponse.data.output;
          const imageUrl = Array.isArray(output) ? output[0] : output;
          
          return this.createSuccessResponse(imageUrl);
        } else if (status === 'failed' || status === 'canceled') {
          return this.createErrorResponse(
            statusResponse.data.error || 'Object removal failed'
          );
        }
        
        attempts++;
      }

      return this.createErrorResponse('Object removal timed out');
    } catch (error: any) {
      console.error('ObjectRemovalProcessor error:', error);
      
      if (error.response?.status === 401) {
        return this.createErrorResponse('Invalid Replicate API key');
      } else if (error.response?.status === 429) {
        return this.createErrorResponse('Rate limit exceeded. Please try again later.');
      }
      
      return this.createErrorResponse(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        error.message || 
        'Failed to remove object'
      );
    }
  }

}

