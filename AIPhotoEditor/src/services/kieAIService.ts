import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { VideoTransformResponse } from '../types/video';
import { TransformResponse, AIService } from './aiService';

/**
 * Kie.ai API Service
 * Handles integration with Kie.ai models for video generation, image generation, and editing
 */
export class KieAIService {
  private static readonly BASE_URL = 'https://api.kie.ai/api/v1';
  
  /**
   * Transform image using Nano Banana Edit (image editing)
   * @param imageUri - URI of the image to transform
   * @param prompt - Prompt describing the transformation
   * @param config - Optional configuration
   */
  static async transformImageWithNanoBanana(
    imageUri: string,
    prompt: string,
    config?: {
      outputFormat?: 'png' | 'jpeg';
      imageSize?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto';
    }
  ): Promise<TransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });

      // Determine file type from URI or default to jpeg
      const fileExt = imageUri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
      const imageDataUrl = `data:image/${fileExt};base64,${base64}`;

      // Try to upload image first, but if that fails, we'll try sending base64 directly
      let imageUrl: string | null = null;
      try {
        imageUrl = await this.uploadImage(imageDataUrl);
        console.log('[KieAIService] Image uploaded successfully');
        
        // Verify we got a real URL (not a data URL)
        if (imageUrl.startsWith('data:')) {
          console.warn('[KieAIService] Upload returned data URL, will try alternative method');
          imageUrl = null;
        }
      } catch (uploadError: any) {
        console.warn('[KieAIService] Upload failed, will try sending image directly:', uploadError.message);
        imageUrl = null;
      }

      // Prepare request body - try different formats
      let requestBody: any;
      
      if (imageUrl) {
        // We have a valid HTTP URL, use it
        requestBody = {
          model: 'google/nano-banana-edit',
          input: {
            prompt: prompt,
            image_urls: [imageUrl],
            output_format: config?.outputFormat || 'jpeg',
            image_size: config?.imageSize || 'auto',
          },
        };
      } else {
        // No upload URL available - try sending image as base64 in different formats
        console.log('[KieAIService] Trying to send image as base64 directly...');
        
        // Extract just the base64 part (remove data:image/...;base64, prefix)
        const base64Data = base64;
        
        // Try multiple possible formats
        requestBody = {
          model: 'google/nano-banana-edit',
          input: {
            prompt: prompt,
            // Try base64 in different fields
            image: base64Data,
            image_base64: base64Data,
            image_data: base64Data,
            image_urls: [`data:image/${fileExt};base64,${base64Data}`], // Last resort - data URL
            output_format: config?.outputFormat || 'jpeg',
            image_size: config?.imageSize || 'auto',
          },
        };
        
        console.warn('[KieAIService] No upload endpoint available. Trying to send image directly. This may fail if API requires HTTP URLs.');
      }

      // Call Kie.ai API using the correct endpoint structure: /jobs/createTask
      // Based on API docs: POST /api/v1/jobs/createTask
      console.log('[KieAIService] Creating job via /jobs/createTask...');
      const response = await axios.post(
        `${this.BASE_URL}/jobs/createTask`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
        }
      );

      console.log('[KieAIService] Job creation response:', JSON.stringify(response.data, null, 2));

      // Check for error responses first (API may return errors in response.data instead of HTTP status)
      if (response.data.code && response.data.code !== 200 && response.data.code !== 201) {
        const errorMsg = response.data.msg || response.data.message || response.data.error || 'Unknown API error';
        console.error('[KieAIService] API returned error:', response.data);
        
        // Check for specific error messages
        if (errorMsg.toLowerCase().includes('image_urls') || errorMsg.toLowerCase().includes('file type not supported') || errorMsg.toLowerCase().includes('not supported')) {
          throw new Error('Image format not supported. The API requires publicly accessible HTTP URLs for images, but the upload endpoint is not available. Please check Kie.ai API documentation for the correct image upload method.');
        } else if (errorMsg.toLowerCase().includes('credit') || errorMsg.toLowerCase().includes('payment') || errorMsg.toLowerCase().includes('insufficient')) {
          throw new Error('Insufficient credits or payment issue. Please check your account balance.');
        } else {
          throw new Error(`API error: ${errorMsg}`);
        }
      }

      // The API returns a job/task ID that needs to be polled
      const jobId = response.data.id || response.data.job_id || response.data.task_id || response.data.data?.id;
      
      if (!jobId) {
        // Check if response has immediate output (unlikely but possible)
        if (response.data.output || response.data.image_url || response.data.url || response.data.data?.output) {
          const resultImageUrl = response.data.output || response.data.image_url || response.data.url || response.data.data?.output;
          console.log('[KieAIService] Received immediate output');
          const localUri = await this.downloadImage(resultImageUrl);
          return {
            success: true,
            imageUri: localUri,
          };
        }
        
        console.error('[KieAIService] No job ID in response. Full response:', JSON.stringify(response.data, null, 2));
        
        // Extract error message from response if available
        const errorMsg = response.data.msg || response.data.message || response.data.error;
        if (errorMsg) {
          throw new Error(`API error: ${errorMsg}`);
        }
        
        throw new Error('Invalid API response: no job ID returned. The server may have encountered an error.');
      }

      console.log('[KieAIService] Job created, ID:', jobId);
      console.log('[KieAIService] Polling for job completion...');
      
      // Poll for job completion
      const resultImageUrl = await this.pollImageGeneration(jobId);
      
      // Download image to local storage
      const localUri = await this.downloadImage(resultImageUrl);

      return {
        success: true,
        imageUri: localUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Nano Banana transform error:', error);
      console.error('[KieAIService] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      // Enhanced error handling
      let errorMessage = 'Failed to transform image with Nano Banana';
      
      if (error.response) {
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        console.error('[KieAIService] HTTP error:', statusCode, responseData);
        
        // Check for error in response data structure (some APIs return errors in data.code/data.msg)
        if (responseData?.code && responseData.code !== 200) {
          const apiErrorMsg = responseData.msg || responseData.message || responseData.error || 'Unknown API error';
          
          // Check for specific error messages
          if (apiErrorMsg.toLowerCase().includes('image_urls') || apiErrorMsg.toLowerCase().includes('file type not supported')) {
            errorMessage = 'Image format not supported. The API requires properly uploaded image URLs. Please try again or check your image format.';
          } else if (apiErrorMsg.toLowerCase().includes('credit') || apiErrorMsg.toLowerCase().includes('payment') || apiErrorMsg.toLowerCase().includes('insufficient')) {
            errorMessage = 'Insufficient credits or payment issue. Please check your account balance.';
          } else {
            errorMessage = apiErrorMsg;
          }
        } else {
          // Handle specific HTTP status codes
          if (statusCode === 402) {
            errorMessage = 'Payment required. Please check your account balance or subscription.';
          } else if (statusCode === 403) {
            errorMessage = 'Access forbidden. Please check your API key permissions or account status.';
          } else if (statusCode === 404) {
            errorMessage = 'API endpoint not found. The service may have changed or the endpoint path is incorrect.';
          } else if (statusCode === 429) {
            errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
          } else if (statusCode === 401) {
            errorMessage = 'Authentication failed. Please check your API key.';
          } else if (statusCode >= 500) {
            // Check response data for more details on 500 errors
            const responseText = JSON.stringify(responseData || {}).toLowerCase();
            if (responseText.includes('image_urls') || responseText.includes('file type')) {
              errorMessage = 'Image format not supported. The API requires properly uploaded image URLs. Please try again.';
            } else {
              errorMessage = `Server error (${statusCode}). Please try again later.`;
            }
          } else {
            // Try to extract meaningful error message
            errorMessage = responseData?.error || 
                          responseData?.message || 
                          responseData?.msg ||
                          responseData?.detail || 
                          `API Error: ${statusCode}`;
          }
        }
        
        // Check for credit/payment related errors in response
        const errorText = JSON.stringify(responseData || {}).toLowerCase();
        if (errorText.includes('credit') || 
            errorText.includes('payment') || 
            errorText.includes('insufficient') || 
            errorText.includes('balance') ||
            errorText.includes('quota')) {
          errorMessage = responseData?.msg || 
                        responseData?.error || 
                        responseData?.message || 
                        responseData?.detail || 
                        'Insufficient credits or payment issue. Please check your account balance.';
        }
      } else if (error.request) {
        // Network error
        console.error('[KieAIService] Network error - no response received');
        errorMessage = 'Network error. Please check your internet connection and try again.';
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          errorMessage = 'Request timed out. The server may be busy or your connection is slow. Please try again.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Transform multiple images using Nano Banana Edit
   * @param imageUris - Array of image URIs to transform
   * @param prompt - Prompt describing the transformation
   * @param config - Optional configuration
   */
  static async transformImagesWithNanoBanana(
    imageUris: string[],
    prompt: string,
    config?: {
      outputFormat?: 'png' | 'jpeg';
      imageSize?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto';
    }
  ): Promise<TransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      if (!imageUris || imageUris.length === 0) {
        return {
          success: false,
          error: 'At least one image is required',
        };
      }

      if (imageUris.length > 10) {
        return {
          success: false,
          error: 'Maximum 10 images supported',
        };
      }

      // Convert all images to base64 and upload
      console.log(`[KieAIService] Converting ${imageUris.length} images...`);
      const imageUrls = await Promise.all(
        imageUris.map(async (uri, index) => {
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: 'base64',
            });
            const fileExt = uri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
            const imageDataUrl = `data:image/${fileExt};base64,${base64}`;
            const uploadedUrl = await this.uploadImage(imageDataUrl);
            console.log(`[KieAIService] Image ${index + 1} uploaded`);
            return uploadedUrl;
          } catch (error) {
            console.error(`[KieAIService] Failed to process image ${index + 1}:`, error);
            throw error;
          }
        })
      );

      console.log(`[KieAIService] Sending ${imageUrls.length} images to Nano Banana Edit API...`);

      // Call Kie.ai API using the correct endpoint structure: /jobs/createTask
      console.log('[KieAIService] Creating job via /jobs/createTask for multiple images...');
      const response = await axios.post(
        `${this.BASE_URL}/jobs/createTask`,
        {
          model: 'google/nano-banana-edit',
          input: {
            prompt: prompt,
            image_urls: imageUrls, // Array of image URLs
            output_format: config?.outputFormat || 'jpeg',
            image_size: config?.imageSize || 'auto',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      console.log('[KieAIService] Job creation response:', JSON.stringify(response.data, null, 2));

      // The API returns a job/task ID that needs to be polled
      const jobId = response.data.id || response.data.job_id || response.data.task_id;
      
      if (!jobId) {
        // Check if response has immediate output (unlikely but possible)
        if (response.data.output || response.data.image_url || response.data.url) {
          const resultImageUrl = response.data.output || response.data.image_url || response.data.url;
          console.log('[KieAIService] Received immediate output');
          const localUri = await this.downloadImage(resultImageUrl);
          return {
            success: true,
            imageUri: localUri,
          };
        }
        
        console.error('[KieAIService] No job ID in response. Full response:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid API response: no job ID returned');
      }

      console.log('[KieAIService] Job created, ID:', jobId);
      console.log('[KieAIService] Polling for job completion...');
      
      // Poll for job completion
      const resultImageUrl = await this.pollImageGeneration(jobId);
      
      // Download image to local storage
      const localUri = await this.downloadImage(resultImageUrl);

      return {
        success: true,
        imageUri: localUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Nano Banana transformImages error:', error);
      console.error('[KieAIService] Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      // Enhanced error handling
      let errorMessage = 'Failed to transform images with Nano Banana';
      
      if (error.response) {
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        console.error('[KieAIService] HTTP error:', statusCode, responseData);
        
        // Handle specific HTTP status codes
        if (statusCode === 402) {
          errorMessage = 'Payment required. Please check your account balance or subscription.';
        } else if (statusCode === 403) {
          errorMessage = 'Access forbidden. Please check your API key permissions or account status.';
        } else if (statusCode === 404) {
          errorMessage = 'API endpoint not found. The service may have changed or the endpoint path is incorrect.';
        } else if (statusCode === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
        } else if (statusCode === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (statusCode >= 500) {
          errorMessage = `Server error (${statusCode}). Please try again later.`;
        } else {
          // Try to extract meaningful error message
          errorMessage = responseData?.error || 
                        responseData?.message || 
                        responseData?.detail || 
                        `API Error: ${statusCode}`;
        }
        
        // Check for credit/payment related errors in response
        const errorText = JSON.stringify(responseData || {}).toLowerCase();
        if (errorText.includes('credit') || 
            errorText.includes('payment') || 
            errorText.includes('insufficient') || 
            errorText.includes('balance') ||
            errorText.includes('quota')) {
          errorMessage = responseData?.error || 
                        responseData?.message || 
                        responseData?.detail || 
                        'Insufficient credits or payment issue. Please check your account balance.';
        }
      } else if (error.request) {
        // Network error
        console.error('[KieAIService] Network error - no response received');
        errorMessage = 'Network error. Please check your internet connection and try again.';
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          errorMessage = 'Request timed out. The server may be busy or your connection is slow. Please try again.';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate image from text prompt using Nano Banana
   * @param prompt - Prompt for image generation
   * @param config - Optional configuration
   */
  static async generateImageWithNanoBanana(
    prompt: string,
    config?: {
      outputFormat?: 'png' | 'jpeg';
      imageSize?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '21:9' | 'auto';
    }
  ): Promise<TransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      // Call Kie.ai Nano Banana API for generation (google/nano-banana)
      const response = await axios.post(
        `${this.BASE_URL}/models/google/nano-banana`,
        {
          prompt: prompt,
          output_format: config?.outputFormat || 'jpeg',
          image_size: config?.imageSize || 'auto',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      // Handle response - check if image is returned immediately or needs polling
      let resultImageUrl: string;
      
      if (response.data.output || response.data.image_url || response.data.url) {
        // Immediate response with image URL
        resultImageUrl = response.data.output || response.data.image_url || response.data.url;
        console.log('[KieAIService] Received immediate response with image URL');
      } else if (response.data.id || response.data.job_id) {
        // Async response - need to poll
        console.log('[KieAIService] Received async job, polling for result...');
        resultImageUrl = await this.pollImageGeneration(response.data.id || response.data.job_id);
      } else {
        throw new Error('Invalid API response: no output or job ID');
      }
      
      // Download image to local storage
      const localUri = await this.downloadImage(resultImageUrl);

      return {
        success: true,
        imageUri: localUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Nano Banana generation error:', error);
      
      let errorMessage = 'Failed to generate image with Nano Banana';
      if (error.response) {
        errorMessage = error.response.data?.error || error.response.data?.message || `API Error: ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Poll for image generation/editing completion
   */
  private static async pollImageGeneration(jobId: string, maxAttempts: number = 60): Promise<string> {
    const apiKey = await AIService.getKieAIApiKey();
    
    console.log(`[KieAIService] Starting to poll job ${jobId}, max attempts: ${maxAttempts}`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.BASE_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        });

        // Log response for debugging
        console.log(`[KieAIService] Poll attempt ${attempt + 1}/${maxAttempts}`);
        console.log(`[KieAIService] Response data:`, JSON.stringify(response.data, null, 2));

        // Check if response.data exists
        if (!response.data) {
          console.error(`[KieAIService] No data in response. Status code: ${response.status}`);
          if (attempt === maxAttempts - 1) {
            throw new Error('API returned empty response. This may indicate a server error or service outage.');
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        const status = response.data.status;
        
        // Handle undefined/null status
        if (status === undefined || status === null) {
          console.error(`[KieAIService] Status is undefined/null. Response:`, JSON.stringify(response.data, null, 2));
          if (attempt === maxAttempts - 1) {
            throw new Error('API returned invalid response format. Status field is missing.');
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        console.log(`[KieAIService] Job status: ${status}`);

        if (status === 'completed' || status === 'succeeded' || status === 'success') {
          // Extract image URL from response - check multiple possible fields
          const imageUrl = response.data.output || 
                          response.data.output_url || 
                          response.data.image_url || 
                          response.data.url ||
                          response.data.result?.url ||
                          response.data.result?.image_url ||
                          response.data.result?.output ||
                          response.data.data?.output ||
                          response.data.data?.url;
          
          if (imageUrl) {
            console.log(`[KieAIService] Job completed, image URL: ${imageUrl}`);
            return imageUrl;
          }
          
          console.error(`[KieAIService] Job completed but no image URL found. Response keys:`, Object.keys(response.data));
          console.error(`[KieAIService] Full response:`, JSON.stringify(response.data, null, 2));
          throw new Error('Job completed but no image URL in response. Please try again.');
        }

        if (status === 'failed' || status === 'error' || status === 'failure') {
          const errorMsg = response.data.error || 
                          response.data.message || 
                          response.data.detail || 
                          response.data.error_message ||
                          'Image generation failed';
          
          // Check for credit/payment related errors
          const errorMsgLower = errorMsg.toLowerCase();
          if (errorMsgLower.includes('credit') || 
              errorMsgLower.includes('payment') || 
              errorMsgLower.includes('insufficient') || 
              errorMsgLower.includes('balance') ||
              errorMsgLower.includes('quota')) {
            console.error(`[KieAIService] Credit/payment error detected:`, errorMsg);
            throw new Error(`Insufficient credits or payment issue: ${errorMsg}. Please check your account balance.`);
          }
          
          console.error(`[KieAIService] Job failed with error:`, errorMsg);
          throw new Error(errorMsg);
        }

        // Handle unknown status values
        if (status !== 'pending' && status !== 'processing' && status !== 'queued' && status !== 'running') {
          console.warn(`[KieAIService] Unknown status received: ${status}. Will continue polling.`);
        }

        // Wait before next poll (exponential backoff)
        const waitTime = Math.min(2000 * Math.pow(1.2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error: any) {
        console.error(`[KieAIService] Poll error on attempt ${attempt + 1}/${maxAttempts}:`, error);
        
        // Check for credit/payment errors in HTTP response
        if (error.response) {
          const statusCode = error.response.status;
          const responseData = error.response.data;
          
          console.error(`[KieAIService] HTTP error status: ${statusCode}`);
          console.error(`[KieAIService] HTTP error response:`, JSON.stringify(responseData, null, 2));
          
          // Handle specific HTTP status codes
          if (statusCode === 402) {
            throw new Error('Payment required. Please check your account balance or subscription.');
          } else if (statusCode === 403) {
            throw new Error('Access forbidden. Please check your API key permissions.');
          } else if (statusCode === 429) {
            throw new Error('Rate limit exceeded. Please try again in a few moments.');
          } else if (statusCode === 401) {
            throw new Error('Authentication failed. Please check your API key.');
          } else if (statusCode >= 500) {
            throw new Error(`Server error (${statusCode}). Please try again later.`);
          }
          
          // Check for credit/payment errors in error message
          const errorText = JSON.stringify(responseData || {}).toLowerCase();
          if (errorText.includes('credit') || 
              errorText.includes('payment') || 
              errorText.includes('insufficient') || 
              errorText.includes('balance') ||
              errorText.includes('quota')) {
            const errorMsg = responseData?.error || responseData?.message || responseData?.detail || 'Insufficient credits';
            throw new Error(`Credit/payment issue: ${errorMsg}. Please check your account.`);
          }
        }
        
        // If error message indicates failure, throw immediately
        if (error.message && (error.message.includes('failed') || error.message.includes('error') || error.message.includes('credit') || error.message.includes('payment'))) {
          throw error;
        }
        
        // On last attempt, throw with detailed error
        if (attempt === maxAttempts - 1) {
          const detailedError = error.message || error.response?.data?.error || error.response?.data?.message || 'Unknown error';
          throw new Error(`Image generation timeout or error: ${detailedError}`);
        }
        
        // For other errors, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Image generation timed out after maximum polling attempts. The job may still be processing on the server.');
  }

  /**
   * Upload image to Kie.ai and get URL
   * Tries multiple upload endpoint paths since the exact endpoint may vary
   */
  private static async uploadImage(imageDataUrl: string): Promise<string> {
    const apiKey = await AIService.getKieAIApiKey();
    
    // Try multiple possible upload endpoint paths
    const uploadEndpoints = [
      `${this.BASE_URL}/upload`,
      `${this.BASE_URL}/uploads`,
      `${this.BASE_URL}/files/upload`,
      `https://api.kie.ai/api/v1/upload`,
      `https://api.kie.ai/api/v1/uploads`,
    ];

    let lastError: any;
    
    for (const endpoint of uploadEndpoints) {
      try {
        console.log(`[KieAIService] Trying upload endpoint: ${endpoint}`);
        
        const response = await axios.post(
          endpoint,
          {
            file: imageDataUrl,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const uploadedUrl = response.data.url || response.data.image_url || response.data.upload_url || response.data.data?.url;
        if (uploadedUrl && !uploadedUrl.startsWith('data:')) {
          console.log(`[KieAIService] Upload successful via ${endpoint}`);
          return uploadedUrl;
        }
        
        // If we got a response but no URL, try next endpoint
        lastError = new Error('Upload succeeded but no URL returned');
      } catch (error: any) {
        console.log(`[KieAIService] Upload endpoint ${endpoint} failed: ${error.response?.status || error.message}`);
        lastError = error;
        // Continue to next endpoint
      }
    }

    // If all upload endpoints fail, throw error instead of falling back to data URL
    console.error('[KieAIService] All upload endpoints failed');
    throw new Error('Failed to upload image. All upload endpoints returned errors. The API may require a different upload method. Please check the API documentation or try again later.');
  }

  /**
   * Download image from URL to local storage
   */
  private static async downloadImage(imageUrl: string): Promise<string> {
    try {
      console.log('[KieAIService] Downloading image from URL:', imageUrl);

      // If it's a data URL, extract and save directly
      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const format = matches[1];
          const base64Data = matches[2];
          const filename = `transformed_${Date.now()}.${format === 'png' ? 'png' : 'jpg'}`;
          const fileUri = `${FileSystem.documentDirectory}${filename}`;
          
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          return fileUri;
        }
      }

      // Otherwise download from URL
      const filename = `transformed_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: HTTP ${downloadResult.status}`);
      }

      return downloadResult.uri;
    } catch (error: any) {
      console.error('[KieAIService] Download image error:', error);
      throw new Error(`Failed to download transformed image: ${error.message}`);
    }
  }

  /**
   * Generate video from text prompt using Veo 3.1
   */
  static async generateVideoWithVeo(
    prompt: string,
    config?: {
      duration?: number;
      aspectRatio?: '16:9' | '9:16' | '1:1';
      quality?: 'high' | 'medium' | 'low';
    }
  ): Promise<VideoTransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      // TODO: Replace with actual Kie.ai API endpoint and parameters
      const response = await axios.post(
        `${this.BASE_URL}/video/generate`,
        {
          model: 'veo-3.1',
          prompt,
          duration: config?.duration || 5,
          aspect_ratio: config?.aspectRatio || '16:9',
          quality: config?.quality || 'high',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Poll for completion if async
      const videoUrl = await this.pollForCompletion(response.data.id);
      
      // Download video to local storage
      const videoUri = await this.downloadVideo(videoUrl);

      return {
        success: true,
        videoUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Veo video generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate video with Veo',
      };
    }
  }

  /**
   * Generate video from text prompt using Veo 3.1 Fast
   */
  static async generateVideoWithVeoFast(
    prompt: string,
    config?: {
      duration?: number;
      aspectRatio?: '16:9' | '9:16' | '1:1';
    }
  ): Promise<VideoTransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      // TODO: Replace with actual Kie.ai API endpoint
      const response = await axios.post(
        `${this.BASE_URL}/video/generate`,
        {
          model: 'veo-3.1-fast',
          prompt,
          duration: config?.duration || 5,
          aspect_ratio: config?.aspectRatio || '16:9',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const videoUrl = await this.pollForCompletion(response.data.id);
      const videoUri = await this.downloadVideo(videoUrl);

      return {
        success: true,
        videoUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Veo Fast video generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate video with Veo Fast',
      };
    }
  }

  /**
   * Generate video from text prompt using Kling 2.1
   */
  static async generateVideoWithKling(
    prompt: string,
    config?: {
      duration?: number;
      aspectRatio?: '16:9' | '9:16' | '1:1';
    }
  ): Promise<VideoTransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      // TODO: Replace with actual Kie.ai API endpoint
      const response = await axios.post(
        `${this.BASE_URL}/video/generate`,
        {
          model: 'kling-2.1',
          prompt,
          duration: config?.duration || 5,
          aspect_ratio: config?.aspectRatio || '16:9',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const videoUrl = await this.pollForCompletion(response.data.id);
      const videoUri = await this.downloadVideo(videoUrl);

      return {
        success: true,
        videoUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Kling video generation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate video with Kling',
      };
    }
  }

  /**
   * Edit video using Runway Aleph
   */
  static async editVideoWithRunway(
    videoUri: string,
    config: {
      operation: 'remove_object' | 'add_object' | 'style_transfer' | 'relight';
      prompt?: string;
      objectToRemove?: string;
      style?: string;
    }
  ): Promise<VideoTransformResponse> {
    try {
      const apiKey = await AIService.getKieAIApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: 'Kie.ai API key not configured. Please configure it via EAS Secrets or Environment Variables before building.',
        };
      }

      // Upload video first
      const videoUrl = await this.uploadVideo(videoUri);

      // TODO: Replace with actual Kie.ai API endpoint
      const response = await axios.post(
        `${this.BASE_URL}/video/edit`,
        {
          model: 'runway-aleph',
          video_url: videoUrl,
          operation: config.operation,
          prompt: config.prompt,
          object_to_remove: config.objectToRemove,
          style: config.style,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const editedVideoUrl = await this.pollForCompletion(response.data.id);
      const editedVideoUri = await this.downloadVideo(editedVideoUrl);

      return {
        success: true,
        videoUri: editedVideoUri,
      };
    } catch (error: any) {
      console.error('[KieAIService] Runway video editing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to edit video with Runway',
      };
    }
  }

  /**
   * Poll for job completion
   */
  private static async pollForCompletion(jobId: string, maxAttempts: number = 60): Promise<string> {
    const apiKey = await AIService.getKieAIApiKey();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.BASE_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.data.status === 'completed') {
          return response.data.output_url;
        }

        if (response.data.status === 'failed') {
          throw new Error(response.data.error || 'Video generation failed');
        }

        // Wait before next poll (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(1.5, attempt), 10000)));
      } catch (error: any) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Video generation timeout');
  }

  /**
   * Upload video to Kie.ai
   */
  private static async uploadVideo(videoUri: string): Promise<string> {
    // TODO: Implement video upload to Kie.ai
    // This should upload the video file and return a URL
    const videoData = await FileSystem.readAsStringAsync(videoUri, {
      encoding: 'base64',
    });

    const apiKey = await AIService.getKieAIApiKey();
    const response = await axios.post(
      `${this.BASE_URL}/upload`,
      {
        file: `data:video/mp4;base64,${videoData}`,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.url;
  }

  /**
   * Download video from URL to local storage
   */
  private static async downloadVideo(videoUrl: string): Promise<string> {
    const fileName = `video_${Date.now()}.mp4`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);
    
    if (downloadResult.status !== 200) {
      throw new Error('Failed to download video');
    }

    return downloadResult.uri;
  }
}

