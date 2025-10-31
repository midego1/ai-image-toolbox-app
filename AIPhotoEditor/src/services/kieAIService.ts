import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { getKieAIApiKey } from '../config/apiKeys';
import { VideoTransformResponse } from '../types/video';
import { TransformResponse } from './aiService';

/**
 * Kie.ai API Service
 * Handles integration with Kie.ai models for video generation, image generation, and editing
 */
export class KieAIService {
  private static readonly BASE_URL = 'https://api.kie.ai/v1';
  
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
      const apiKey = getKieAIApiKey();
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

      // Upload image first and get URL
      const imageUrl = await this.uploadImage(imageDataUrl);

      // Call Kie.ai Nano Banana Edit API (google/nano-banana-edit)
      const response = await axios.post(
        `${this.BASE_URL}/models/google/nano-banana-edit`,
        {
          prompt: prompt,
          image_urls: [imageUrl],
          output_format: config?.outputFormat || 'jpeg',
          image_size: config?.imageSize || 'auto',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
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
      console.error('[KieAIService] Nano Banana transform error:', error);
      
      let errorMessage = 'Failed to transform image with Nano Banana';
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
      const apiKey = getKieAIApiKey();
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

      // Call Kie.ai Nano Banana Edit API with multiple images (google/nano-banana-edit)
      const response = await axios.post(
        `${this.BASE_URL}/models/google/nano-banana-edit`,
        {
          prompt: prompt,
          image_urls: imageUrls,
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
      console.error('[KieAIService] Nano Banana transformImages error:', error);
      
      let errorMessage = 'Failed to transform images with Nano Banana';
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
      const apiKey = getKieAIApiKey();
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
    const apiKey = getKieAIApiKey();
    
    console.log(`[KieAIService] Starting to poll image job ${jobId}, max attempts: ${maxAttempts}`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.BASE_URL}/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        });

        const status = response.data.status;
        console.log(`[KieAIService] Poll attempt ${attempt + 1}/${maxAttempts}, status: ${status}`);

        if (status === 'completed' || status === 'succeeded') {
          // Extract image URL from response
          const imageUrl = response.data.output_url || response.data.output || response.data.image_url;
          if (imageUrl) {
            console.log(`[KieAIService] Image generation completed, URL: ${imageUrl}`);
            return imageUrl;
          }
          throw new Error('Job completed but no image URL in response');
        }

        if (status === 'failed' || status === 'error') {
          const errorMsg = response.data.error || response.data.message || 'Image generation failed';
          throw new Error(errorMsg);
        }

        // Wait before next poll (exponential backoff)
        const waitTime = Math.min(2000 * Math.pow(1.2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } catch (error: any) {
        if (error.message && (error.message.includes('failed') || error.message.includes('error'))) {
          throw error;
        }
        if (attempt === maxAttempts - 1) {
          throw new Error(error.message || 'Image generation timeout');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Image generation timeout');
  }

  /**
   * Upload image to Kie.ai and get URL
   */
  private static async uploadImage(imageDataUrl: string): Promise<string> {
    try {
      const apiKey = getKieAIApiKey();
      
      const response = await axios.post(
        `${this.BASE_URL}/upload`,
        {
          file: imageDataUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.url || response.data.image_url || response.data.upload_url;
    } catch (error: any) {
      console.error('[KieAIService] Image upload error:', error);
      // If upload fails, try using the data URL directly
      console.log('[KieAIService] Falling back to direct data URL usage');
      return imageDataUrl;
    }
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
      const apiKey = getKieAIApiKey();
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
      const apiKey = getKieAIApiKey();
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
      const apiKey = getKieAIApiKey();
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
      const apiKey = getKieAIApiKey();
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
    const apiKey = getKieAIApiKey();
    
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

    const apiKey = getKieAIApiKey();
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

