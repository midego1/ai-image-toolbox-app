import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

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
   * Transform image using Replicate API
   */
  static async transformImage(
    imageUri: string,
    prompt: string,
    model: string = 'google/nano-banana'
  ): Promise<TransformResponse> {
    try {
      const apiKey = await getReplicateApiKey();

      if (apiKey === REPLICATE_API_KEY_FALLBACK) {
        return {
          success: false,
          error: 'Replicate API key not configured. Please set it in app settings.',
        };
      }

      // Read image file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Call Replicate API using google/nano-banana model (Gemini 2.5 Flash)
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: '2c8a3b5b81554aa195bde461e2caa6afacd69a66c48a64fb0e650c9789f8b8a0', // google/nano-banana
          input: {
            prompt: prompt,
            image_input: [`data:image/jpeg;base64,${base64}`],
            aspect_ratio: 'match_input_image',
            output_format: 'jpg',
          },
        },
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Poll for result
      const predictionId = response.data.id;
      let result = await this.pollPrediction(predictionId, apiKey);

      if (result.success && result.imageUri) {
        return result;
      }

      return {
        success: false,
        error: result.error || 'Failed to transform image',
      };
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
   */
  static async transformImages(
    params: MultiImageTransformParams
  ): Promise<TransformResponse> {
    try {
      const apiKey = await getReplicateApiKey();
      const { imageUris, prompt, model = 'google/nano-banana' } = params;

      if (apiKey === REPLICATE_API_KEY_FALLBACK) {
        return {
          success: false,
          error: 'Replicate API key not configured. Please set it in app settings.',
        };
      }

      if (!imageUris || imageUris.length === 0) {
        return {
          success: false,
          error: 'At least one image is required',
        };
      }

      // Convert all images to base64
      console.log(`[AIService] Converting ${imageUris.length} images to base64...`);
      const base64Images = await Promise.all(
        imageUris.map(async (uri, index) => {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: 'base64',
            });
            console.log(`[AIService] Image ${index + 1} converted, length: ${base64.length}`);
            return `data:image/jpeg;base64,${base64}`;
          } catch (error) {
            console.error(`[AIService] Failed to convert image ${index + 1}:`, error);
            throw error;
          }
        })
      );

      console.log(`[AIService] Sending ${base64Images.length} images to Replicate API...`);
      console.log(`[AIService] Prompt length: ${prompt.length} characters`);

      // Call Replicate API with multiple images
      const requestPayload = {
        version: '2c8a3b5b81554aa195bde461e2caa6afacd69a66c48a64fb0e650c9789f8b8a0', // google/nano-banana
        input: {
          prompt: prompt,
          image_input: base64Images, // Array of base64 images
          aspect_ratio: 'match_input_image',
          output_format: 'jpg',
        },
      };

      console.log(`[AIService] Request payload prepared, image_input array length: ${requestPayload.input.image_input.length}`);

      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        requestPayload,
        {
          headers: {
            Authorization: `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout for initial request
        }
      );

      console.log('[AIService] API request successful, response status:', response.status);
      console.log('[AIService] Prediction ID:', response.data?.id);
      console.log('[AIService] Prediction status:', response.data?.status);
      console.log('[AIService] Has output in initial response:', !!response.data?.output);

      // Validate response
      if (!response.data || !response.data.id) {
        console.error('[AIService] Invalid API response:', response.data);
        return {
          success: false,
          error: 'Invalid response from API: missing prediction ID',
        };
      }

      // Check if already completed in initial response (sometimes happens)
      const initialStatus = response.data.status;
      if ((initialStatus === 'succeeded' || initialStatus === 'completed') && response.data.output) {
        console.log('[AIService] Prediction already completed in initial response!');
        let outputUrl: string | undefined;
        
        if (typeof response.data.output === 'string') {
          outputUrl = response.data.output;
        } else if (Array.isArray(response.data.output)) {
          outputUrl = response.data.output[0];
        } else if (response.data.output && typeof response.data.output === 'object') {
          outputUrl = (response.data.output as any).url || (response.data.output as any)[0];
        }

        if (outputUrl && typeof outputUrl === 'string' && (outputUrl.startsWith('http://') || outputUrl.startsWith('https://'))) {
          console.log('[AIService] Downloading from initial response output:', outputUrl);
          try {
            const localUri = await this.downloadImage(outputUrl);
            console.log('[AIService] Download successful from initial response:', localUri);
            return {
              success: true,
              imageUri: localUri,
            };
          } catch (downloadError: any) {
            console.error('[AIService] Download failed from initial response:', downloadError);
            // Fall through to polling as backup
          }
        }
      }

      // Poll for result
      const predictionId = response.data.id;
      console.log('[AIService] Starting to poll prediction:', predictionId);
      let result = await this.pollPrediction(predictionId, apiKey);

      console.log('[AIService] pollPrediction returned:', {
        success: result.success,
        hasImageUri: !!result.imageUri,
        error: result.error
      });

      if (result.success && result.imageUri) {
        console.log('[AIService] transformImages returning success with imageUri:', result.imageUri);
        return result;
      }

      console.error('[AIService] transformImages returning error:', result.error);
      return {
        success: false,
        error: result.error || 'Failed to transform images',
      };
    } catch (error: any) {
      console.error('[AIService] transformImages error:', error);
      
      // Extract more detailed error information
      let errorMessage = 'Failed to transform images';
      
      if (error.response) {
        // API responded with error status
        console.error('[AIService] API Error Response:', error.response.status);
        console.error('[AIService] API Error Data:', error.response.data);
        errorMessage = error.response.data?.detail || error.response.data?.error || `API Error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        console.error('[AIService] No response received from API');
        errorMessage = 'No response from API. Please check your internet connection.';
      } else {
        // Error in setting up request
        console.error('[AIService] Request setup error:', error.message);
        errorMessage = error.message || 'Failed to setup API request';
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
