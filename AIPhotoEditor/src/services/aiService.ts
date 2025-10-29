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
   * Poll for prediction result
   */
  private static async pollPrediction(
    predictionId: string,
    apiKey: string,
    maxAttempts: number = 30
  ): Promise<TransformResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              Authorization: `Token ${apiKey}`,
            },
          }
        );

        const status = response.data.status;

        if (status === 'succeeded') {
          // Handle both string and array output formats
          let outputUrl: string | undefined;

          if (typeof response.data.output === 'string') {
            // Output is a direct URL string
            outputUrl = response.data.output;
          } else if (Array.isArray(response.data.output)) {
            // Output is an array of URLs
            outputUrl = response.data.output[0];
          }

          console.log('Replicate output:', response.data.output);
          console.log('Extracted URL:', outputUrl);

          if (outputUrl && typeof outputUrl === 'string' && outputUrl.startsWith('http')) {
            // Download and save the image
            const localUri = await this.downloadImage(outputUrl);
            return {
              success: true,
              imageUri: localUri,
            };
          } else {
            return {
              success: false,
              error: 'Invalid output URL from API',
            };
          }
        } else if (status === 'failed' || status === 'canceled') {
          return {
            success: false,
            error: `Prediction ${status}`,
          };
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error('Poll prediction error:', error);
        if (i === maxAttempts - 1) {
          return {
            success: false,
            error: error.message || 'Failed to poll prediction',
          };
        }
      }
    }

    return {
      success: false,
      error: 'Prediction timed out',
    };
  }

  /**
   * Download image from URL and save locally
   */
  private static async downloadImage(url: string): Promise<string> {
    try {
      console.log('Downloading image from URL:', url);

      // Validate URL
      if (!url || !url.startsWith('http')) {
        throw new Error(`Invalid URL: ${url}`);
      }

      const filename = `transformed_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      console.log('Saving to:', fileUri);

      // Use FileSystem.downloadAsync for proper file download
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);

      if (!downloadResult.uri) {
        throw new Error('Download failed - no URI returned');
      }

      console.log('Download successful:', downloadResult.uri);
      return downloadResult.uri;
    } catch (error: any) {
      console.error('Download image error:', error);
      console.error('URL that failed:', url);
      throw new Error(`Failed to download transformed image: ${error.message}`);
    }
  }
}
