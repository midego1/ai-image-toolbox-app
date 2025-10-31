import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { getKieAIApiKey } from '../config/apiKeys';
import { VideoTransformResponse } from '../types/video';

/**
 * Kie.ai API Service
 * Handles integration with Kie.ai models for video generation and editing
 */
export class KieAIService {
  private static readonly BASE_URL = 'https://api.kie.ai/v1'; // Update with actual Kie.ai API URL
  
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
          error: 'Kie.ai API key not configured. Please set it in app settings.',
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
          error: 'Kie.ai API key not configured. Please set it in app settings.',
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
          error: 'Kie.ai API key not configured. Please set it in app settings.',
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
          error: 'Kie.ai API key not configured. Please set it in app settings.',
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

