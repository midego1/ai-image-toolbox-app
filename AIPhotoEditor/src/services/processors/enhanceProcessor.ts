import { BaseProcessor } from './baseProcessor';
import { TransformResponse } from '../aiService';
import { EditModeConfig } from '../../types/editModes';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Enhance Processor
 * Uses Replicate's GFPGAN model for face enhancement and image quality improvement
 * Model: tencentarc/gfpgan
 */
export class EnhanceProcessor extends BaseProcessor {
  private static REPLICATE_API_KEY_STORAGE = 'replicate_api_key';
  private static REPLICATE_API_KEY_FALLBACK = 'YOUR_REPLICATE_API_KEY';
  private static MODEL_NAME = 'tencentarc/gfpgan';

  private async getReplicateApiKey(): Promise<string> {
    try {
      const storedKey = await SecureStore.getItemAsync(EnhanceProcessor.REPLICATE_API_KEY_STORAGE);
      if (storedKey) return storedKey;
    } catch (error) {
      console.warn('Could not retrieve Replicate API key from secure storage');
    }
    return EnhanceProcessor.REPLICATE_API_KEY_FALLBACK;
  }

  /**
   * Process image enhancement
   * Config options:
   * - version: string (v1.2, v1.3, v1.4, default: v1.4)
   * - scale: number (2 or 4, default: 2)
   */
  async process(imageUri: string, config?: EditModeConfig): Promise<TransformResponse> {
    if (!this.validateImageUri(imageUri)) {
      return this.createErrorResponse('Invalid image URI provided');
    }

    try {
      const apiKey = await this.getReplicateApiKey();

      if (!apiKey || apiKey === EnhanceProcessor.REPLICATE_API_KEY_FALLBACK) {
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
          const tempUri = `${FileSystem.cacheDirectory}temp_enhance_${Date.now()}.jpg`;
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

      // Determine MIME type
      let mimeType = 'image/jpeg';
      if (imageUri.includes('.png')) {
        mimeType = 'image/png';
      } else if (imageUri.includes('.webp')) {
        mimeType = 'image/webp';
      }

      const imageDataUri = `data:${mimeType};base64,${base64}`;

      // Get model version (fetch latest dynamically)
      const modelName = EnhanceProcessor.MODEL_NAME;
      let modelVersion: string;

      try {
        const modelInfoResponse = await axios.get(
          `https://api.replicate.com/v1/models/${modelName}`,
          {
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (modelInfoResponse.data.latest_version?.id) {
          modelVersion = modelInfoResponse.data.latest_version.id;
        } else {
          const versionsResponse = await axios.get(
            `https://api.replicate.com/v1/models/${modelName}/versions`,
            {
              headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
              },
              params: { page_size: 1 }
            }
          );

          const versions = versionsResponse.data.results;
          if (!versions || versions.length === 0) {
            return this.createErrorResponse('Model version not found');
          }
          modelVersion = versions[0].id;
        }
      } catch (versionError: any) {
        console.error('[EnhanceProcessor] Failed to fetch model version:', versionError);
        return this.createErrorResponse('Failed to fetch model version');
      }

      // Get configuration options
      const version = config?.version || 'v1.4';
      const scale = config?.scale ? Number(config.scale) : 2;

      console.log('[EnhanceProcessor] Starting enhancement:', {
        version,
        scale,
        modelVersion
      });

      // Start prediction
      const predictionResponse = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: modelVersion,
          input: {
            img: imageDataUri,
            version: version,
            scale: scale
          }
        },
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (!predictionResponse.data?.id) {
        console.error('[EnhanceProcessor] No prediction ID in response:', predictionResponse.data);
        return this.createErrorResponse(
          predictionResponse.data?.error || 'Failed to start prediction'
        );
      }

      const predictionId = predictionResponse.data.id;
      console.log('[EnhanceProcessor] Prediction started:', predictionId);

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
          }
        );

        const status = statusResponse.data.status;

        if (status === 'succeeded') {
          const output = statusResponse.data.output;
          // Use the last element of array (latest image) if array, otherwise use directly
          const imageUrl = Array.isArray(output) && output.length > 0
            ? output[output.length - 1]
            : output;

          if (!imageUrl) {
            return this.createErrorResponse('No output URL in response');
          }

          // Download the image to local storage before returning
          try {
            console.log('[EnhanceProcessor] Downloading enhanced image from:', imageUrl);
            const fileUri = `${FileSystem.cacheDirectory}enhance_${Date.now()}.png`;
            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

            if (!downloadResult.uri) {
              return this.createErrorResponse('Failed to download processed image');
            }

            console.log('[EnhanceProcessor] Image downloaded successfully to:', downloadResult.uri);
            return this.createSuccessResponse(downloadResult.uri);
          } catch (downloadError: any) {
            console.error('[EnhanceProcessor] Download error:', downloadError);
            return this.createErrorResponse(`Failed to download image: ${downloadError.message}`);
          }
        } else if (status === 'failed' || status === 'canceled') {
          return this.createErrorResponse(
            statusResponse.data.error || 'Enhancement failed'
          );
        }

        attempts++;
      }

      return this.createErrorResponse('Enhancement timed out');
    } catch (error: any) {
      console.error('EnhanceProcessor error:', error);

      if (error.response?.status === 401) {
        return this.createErrorResponse('Invalid Replicate API key');
      } else if (error.response?.status === 429) {
        return this.createErrorResponse('Rate limit exceeded. Please try again later.');
      }

      return this.createErrorResponse(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to enhance image'
      );
    }
  }
}
