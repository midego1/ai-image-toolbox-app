import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { KieAIService } from './kieAIService';

// Store API keys securely - DO NOT commit real keys to git
const REPLICATE_API_KEY_STORAGE = 'replicate_api_key';

// Fallback constant for development (should be set via SecureStore)
const REPLICATE_API_KEY_FALLBACK = 'YOUR_REPLICATE_API_KEY';

// Get API key from secure storage (or fallback for development)
async function getReplicateApiKey(): Promise<string> {
  try {
    const storedKey = await SecureStore.getItemAsync(REPLICATE_API_KEY_STORAGE);
    if (storedKey) return storedKey;
  } catch (error) {
    console.warn('Could not retrieve Replicate API key from secure storage');
  }
  return REPLICATE_API_KEY_FALLBACK;
}

export interface TransformResponse {
  success: boolean;
  imageUri?: string;
  error?: string;
}

export interface MultiImageTransformParams {
  imageUris: string[];
  prompt: string;
  model?: string;
}

export class AIService {
  /**
   * Set the Replicate API key
   */
  static async setReplicateApiKey(key: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REPLICATE_API_KEY_STORAGE, key);
    } catch (error) {
      console.error('Failed to store Replicate API key:', error);
      throw error;
    }
  }

  /**
   * Check if Replicate API key is configured
   */
  static async hasReplicateApiKey(): Promise<boolean> {
    try {
      const key = await getReplicateApiKey();
      return key !== REPLICATE_API_KEY_FALLBACK && key.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Transform image using Kie.ai Nano Banana Edit API
   * Now uses Kie.ai instead of Replicate for Nano Banana operations
   */
  static async transformImage(
    imageUri: string,
    prompt: string,
    model: string = 'google/nano-banana'
  ): Promise<TransformResponse> {
    try {
      console.log('[AIService] Using Kie.ai Nano Banana Edit for image transformation');
      // Use Kie.ai Nano Banana Edit for image editing/transformation
      return await KieAIService.transformImageWithNanoBanana(
        imageUri,
        prompt,
        {
          outputFormat: 'jpeg',
          imageSize: 'auto',
        }
      );
    } catch (error: any) {
      console.error('AIService transformImage error:', error);
      return {
        success: false,
        error: error.message || 'Failed to transform image',
      };
    }
  }

  /**
   * Transform images using multiple images (for virtual try-on, multi-image composition)
   * Now uses Kie.ai Nano Banana Edit instead of Replicate
   */
  static async transformImages(
    params: MultiImageTransformParams
  ): Promise<TransformResponse> {
    try {
      const { imageUris, prompt, model = 'google/nano-banana' } = params;

      if (!imageUris || imageUris.length === 0) {
        return {
          success: false,
          error: 'At least one image is required',
        };
      }

      console.log(`[AIService] Using Kie.ai Nano Banana Edit for ${imageUris.length} images`);
      console.log(`[AIService] Prompt length: ${prompt.length} characters`);

      // Use Kie.ai Nano Banana Edit for multiple image editing/transformation
      return await KieAIService.transformImagesWithNanoBanana(
        imageUris,
        prompt,
        {
          outputFormat: 'jpeg',
          imageSize: 'auto',
        }
      );
    } catch (error: any) {
      console.error('[AIService] transformImages error:', error);
      
      let errorMessage = 'Failed to transform images';
      if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Poll for prediction result
   */
  private static async pollPrediction(
    predictionId: string,
    apiKey: string,
    maxAttempts: number = 30
  ): Promise<TransformResponse> {
    console.log(`[AIService] Starting to poll prediction ${predictionId}, max attempts: ${maxAttempts}`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              Authorization: `Token ${apiKey}`,
            },
            timeout: 30000, // 30 second timeout
          }
        );

        const status = response.data?.status;
        const hasOutput = !!response.data?.output;
        
        console.log(`[AIService] Poll attempt ${i + 1}/${maxAttempts}, status: ${status}`);
        console.log(`[AIService] Has output: ${hasOutput}`);
        console.log(`[AIService] Response data keys:`, Object.keys(response.data || {}));
        console.log(`[AIService] Output value:`, response.data?.output);
        
        // Extra safety check - if status is undefined, log the full response
        if (!status) {
          console.error('[AIService] Status is undefined! Full response:', JSON.stringify(response.data, null, 2));
        }
        
        // Check for various success statuses
        if (status === 'succeeded' || status === 'completed' || status === 'complete') {
          console.log('[AIService] Prediction succeeded!');
          console.log('[AIService] Full response data:', JSON.stringify(response.data, null, 2));
          
          // Check if output exists
          if (!response.data.output) {
            console.warn('[AIService] Status is succeeded but output is missing. Waiting...');
            // Continue polling - output might not be ready yet
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          
          // Handle both string and array output formats
          let outputUrl: string | undefined;

          if (typeof response.data.output === 'string') {
            // Output is a direct URL string
            outputUrl = response.data.output;
            console.log('[AIService] Output is string:', outputUrl);
          } else if (Array.isArray(response.data.output)) {
            // Output is an array of URLs
            outputUrl = response.data.output[0];
            console.log('[AIService] Output is array, using first element:', outputUrl);
          } else if (response.data.output && typeof response.data.output === 'object') {
            // Sometimes output might be an object with a url property
            outputUrl = (response.data.output as any).url || (response.data.output as any)[0];
            console.log('[AIService] Output is object, extracted:', outputUrl);
          }

          console.log('[AIService] Final extracted URL:', outputUrl);
          console.log('[AIService] URL type:', typeof outputUrl);
          console.log('[AIService] URL starts with http?', outputUrl?.startsWith('http'));

          if (!outputUrl) {
            console.error('[AIService] No output URL found in response');
            return {
              success: false,
              error: 'No output URL in API response',
            };
          }

          if (typeof outputUrl !== 'string') {
            console.error('[AIService] Output URL is not a string:', typeof outputUrl);
            return {
              success: false,
              error: `Invalid output URL type: ${typeof outputUrl}`,
            };
          }

          // Check if it's a valid URL (http/https)
          if (!outputUrl.startsWith('http://') && !outputUrl.startsWith('https://')) {
            console.error('[AIService] Output URL does not start with http:', outputUrl);
            return {
              success: false,
              error: `Invalid output URL format: ${outputUrl.substring(0, 50)}...`,
            };
          }

          console.log('[AIService] Downloading image from:', outputUrl);
          
          try {
            // Download and save the image
            console.log('[AIService] About to download image...');
            const localUri = await this.downloadImage(outputUrl);
            console.log('[AIService] Image downloaded successfully to:', localUri);
            console.log('[AIService] pollPrediction returning SUCCESS with imageUri:', localUri);
            return {
              success: true,
              imageUri: localUri,
            };
          } catch (downloadError: any) {
            console.error('[AIService] Download failed:', downloadError);
            console.error('[AIService] Download error details:', JSON.stringify(downloadError, null, 2));
            return {
              success: false,
              error: `Failed to download image: ${downloadError.message}`,
            };
          }
        } else if (status === 'failed' || status === 'canceled') {
          console.error(`[AIService] Prediction ${status}:`, response.data.error || response.data);
          const errorDetails = response.data.error || `Prediction ${status}`;
          return {
            success: false,
            error: typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails),
          };
        }

        // Wait before next poll
        console.log(`[AIService] Waiting 2 seconds before next poll...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error('[AIService] Poll prediction error (attempt', i + 1, '):', error);
        console.error('[AIService] Error details:', JSON.stringify(error, null, 2));
        
        // If this is the last attempt, return error
        if (i === maxAttempts - 1) {
          console.error('[AIService] Max attempts reached, returning error');
          return {
            success: false,
            error: error.message || 'Failed to poll prediction: ' + (error.response?.data?.detail || 'Unknown error'),
          };
        }
        
        // For non-fatal errors, wait and retry
        console.log('[AIService] Retrying after error...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return {
      success: false,
      error: 'Prediction timed out',
    };
  }

  /**
   * Download image from URL and save locally
   * Uses a timeout wrapper and fallback to fetch if downloadAsync fails
   */
  private static async downloadImage(url: string): Promise<string> {
    try {
      console.log('[AIService] Downloading image from URL:', url);

      // Validate URL
      if (!url || !url.startsWith('http')) {
        throw new Error(`Invalid URL: ${url}`);
      }

      const filename = `transformed_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      console.log('[AIService] Saving to:', fileUri);

      // Wrap downloadAsync with a timeout (60 seconds)
      // If it hangs, we'll fall back to alternative method
      const downloadWithTimeout = async (): Promise<any> => {
        return Promise.race([
          FileSystem.downloadAsync(url, fileUri),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download timeout after 60 seconds')), 60000)
          )
        ]);
      };

      try {
        console.log('[AIService] Attempting download with FileSystem.downloadAsync...');
        const downloadResult = await downloadWithTimeout();
        console.log('[AIService] Download result:', downloadResult);
        
        if (!downloadResult.uri) {
          throw new Error('Download failed - no URI returned');
        }

        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        console.log('[AIService] File info:', fileInfo);
        
        if (!fileInfo.exists) {
          throw new Error('Downloaded file does not exist');
        }

        console.log('[AIService] Download successful, file exists:', downloadResult.uri);
        return downloadResult.uri;
      } catch (downloadError: any) {
        console.warn('[AIService] FileSystem.downloadAsync failed or timed out, trying alternative method:', downloadError.message);
        
        // Fallback: Download to temp file with timeout, then copy to final location
        // This avoids issues if the direct download to final location hangs
        console.log('[AIService] Using temp file fallback method...');
        try {
          const tempUri = `${FileSystem.cacheDirectory}temp_dl_${Date.now()}.jpg`;
          console.log('[AIService] Attempting download to temp location:', tempUri);
          
          // Try downloading to temp with timeout
          const tempDownloadPromise = FileSystem.downloadAsync(url, tempUri);
          const tempTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Temp download timeout after 60 seconds')), 60000)
          );
          
          const tempResult = await Promise.race([tempDownloadPromise, tempTimeoutPromise]) as any;
          console.log('[AIService] Temp download complete:', tempResult.uri);
          
          if (!tempResult.uri) {
            throw new Error('Temp download failed - no URI returned');
          }
          
          // Verify temp file exists
          const tempFileInfo = await FileSystem.getInfoAsync(tempResult.uri);
          if (!tempFileInfo.exists) {
            throw new Error('Temp downloaded file does not exist');
          }
          
          // Copy temp file to final location by reading and writing base64
          console.log('[AIService] Copying temp file to final location...');
          const base64Data = await FileSystem.readAsStringAsync(tempResult.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Clean up temp file
          try {
            await FileSystem.deleteAsync(tempResult.uri, { idempotent: true });
          } catch (cleanupError) {
            console.warn('[AIService] Could not clean up temp file:', cleanupError);
          }
          
          // Verify final file exists
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          console.log('[AIService] File info (temp file method):', fileInfo);
          
          if (!fileInfo.exists) {
            throw new Error('Final file does not exist after copy');
          }

          console.log('[AIService] Download successful via temp file method, file exists:', fileUri);
          return fileUri;
        } catch (altError: any) {
          console.error('[AIService] Temp file fallback also failed:', altError);
          // If all else fails, throw the original error
          throw downloadError;
        }
      }
    } catch (error: any) {
      console.error('[AIService] Download image error:', error);
      console.error('[AIService] URL that failed:', url);
      console.error('[AIService] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to download transformed image: ${error.message}`);
    }
  }
}
