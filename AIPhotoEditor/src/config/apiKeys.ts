import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

/**
 * Get Replicate API key from app configuration
 * This supports:
 * - Local Development: .env file (REPLICATE_API_KEY) - loaded via app.config.js
 * - Local Development: app.config.js extra.replicateApiKey (can be set directly)
 * - Production: EAS Environment Variables
 * 
 * EAS automatically maps:
 * - Environment Variables: REPLICATE_API_KEY -> extra.REPLICATE_API_KEY (uppercase) or extra.replicateApiKey (camelCase)
 * - Created via: eas env:create production --name REPLICATE_API_KEY --value your-key --visibility secret --scope project
 * 
 * For local development, create a .env file in the AIPhotoEditor directory:
 *   REPLICATE_API_KEY=your-key-here
 */
export function getReplicateApiKey(): string {
  // Try camelCase first (app.json and EAS Environment Variables)
  let apiKey = Constants.expoConfig?.extra?.replicateApiKey;
  
  // If not found, try uppercase (EAS Environment Variables might use this)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    apiKey = Constants.expoConfig?.extra?.REPLICATE_API_KEY;
  }
  
  // Also check process.env as fallback (some EAS setups)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    // @ts-ignore - process.env might have the key in some contexts
    const envKey = typeof process !== 'undefined' && process.env?.REPLICATE_API_KEY;
    if (envKey && typeof envKey === 'string') {
      apiKey = envKey;
    }
  }
  
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
    // Validate that it's a real key (not empty placeholder)
    if (apiKey !== 'YOUR_REPLICATE_API_KEY' && apiKey.trim().length > 0) {
      // Replicate API keys typically start with "r8_"
      if (apiKey.startsWith('r8_') || apiKey.length >= 10) {
        return apiKey.trim();
      }
    }
  }

  // No key configured or invalid
  return '';
}

/**
 * Check if Replicate API key is configured
 */
export function isApiKeyConfigured(): boolean {
  const key = getReplicateApiKey();
  return key.length > 0 && key !== 'YOUR_REPLICATE_API_KEY';
}

/**
 * Get Kie.ai API key from app configuration
 * Note: For runtime settings (via Settings screen), use AIService.getKieAIApiKey() instead
 * 
 * This supports:
 * - Local Development: .env file (KIE_AI_API_KEY) - loaded via app.config.js
 * - Local Development: app.config.js extra.kieAIApiKey (can be set directly)
 * - Production: EAS Environment Variables
 * 
 * EAS automatically maps:
 * - Environment Variables: KIE_AI_API_KEY -> extra.KIE_AI_API_KEY (uppercase) or extra.kieAIApiKey (camelCase)
 * - Created via: eas env:create production --name KIE_AI_API_KEY --value your-key --visibility secret --scope project
 * 
 * For local development, create a .env file in the AIPhotoEditor directory:
 *   KIE_AI_API_KEY=your-key-here
 */
export function getKieAIApiKey(): string {
  // Try camelCase first (app.json and EAS Environment Variables)
  let apiKey = Constants.expoConfig?.extra?.kieAIApiKey;
  
  // If not found, try uppercase (EAS Environment Variables might use this)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    apiKey = Constants.expoConfig?.extra?.KIE_AI_API_KEY;
  }
  
  // Also check process.env as fallback (some EAS setups)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    // @ts-ignore - process.env might have the key in some contexts
    const envKey = typeof process !== 'undefined' && process.env?.KIE_AI_API_KEY;
    if (envKey && typeof envKey === 'string') {
      apiKey = envKey;
    }
  }
  
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
    // Validate that it's a real key (not empty placeholder)
    if (apiKey !== 'YOUR_KIE_AI_API_KEY' && apiKey.trim().length > 0) {
      return apiKey.trim();
    }
  }
  
  // No key configured or invalid
  return '';
}

/**
 * Check if Kie.ai API key is configured
 */
export function isKieAIKeyConfigured(): boolean {
  const key = getKieAIApiKey();
  return key.length > 0 && key !== 'YOUR_KIE_AI_API_KEY';
}

/**
 * Validation result for API key testing
 */
export interface ApiKeyValidationResult {
  configured: boolean;
  valid: boolean | null; // null = not tested, true = valid, false = invalid
  error?: string;
  testedAt?: Date;
}

/**
 * Validate Replicate API key by making a test API call
 * This actually tests if the key works by calling the Replicate API
 */
export async function validateReplicateApiKey(): Promise<ApiKeyValidationResult> {
  const key = getReplicateApiKey();
  
  if (!key || key.length === 0) {
    return {
      configured: false,
      valid: null,
      error: 'API key not configured',
    };
  }

  try {
    // Make a simple API call to verify the key
    const response = await fetch('https://api.replicate.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return {
        configured: true,
        valid: true,
        testedAt: new Date(),
      };
    } else if (response.status === 401) {
      return {
        configured: true,
        valid: false,
        error: 'Invalid API key (authentication failed)',
        testedAt: new Date(),
      };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        configured: true,
        valid: false,
        error: `API error: ${response.status} - ${errorText}`,
        testedAt: new Date(),
      };
    }
  } catch (error: any) {
    return {
      configured: true,
      valid: null,
      error: `Network error: ${error.message || 'Failed to connect to API'}`,
      testedAt: new Date(),
    };
  }
}

/**
 * Get RevenueCat API key from app configuration
 * This supports:
 * - Local Development: .env file (REVENUE_CAT_API_KEY) - loaded via app.config.js
 * - Local Development: app.config.js extra.revenueCatApiKey (can be set directly)
 * - Production: EAS Environment Variables
 * 
 * EAS automatically maps:
 * - Environment Variables: REVENUE_CAT_API_KEY -> extra.REVENUE_CAT_API_KEY (uppercase) or extra.revenueCatApiKey (camelCase)
 * - Created via: eas env:create production --name REVENUE_CAT_API_KEY --value your-key --visibility secret --scope project
 * 
 * For local development, create a .env file in the AIPhotoEditor directory:
 *   REVENUE_CAT_API_KEY=your-key-here
 */
export function getRevenueCatApiKey(): string {
  // Try camelCase first (app.json and EAS Environment Variables)
  let apiKey = Constants.expoConfig?.extra?.revenueCatApiKey;
  
  // If not found, try uppercase (EAS Environment Variables might use this)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    apiKey = Constants.expoConfig?.extra?.REVENUE_CAT_API_KEY;
  }
  
  // Also check process.env as fallback (some EAS setups)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.length === 0) {
    // @ts-ignore - process.env might have the key in some contexts
    const envKey = typeof process !== 'undefined' && process.env?.REVENUE_CAT_API_KEY;
    if (envKey && typeof envKey === 'string') {
      apiKey = envKey;
    }
  }
  
  if (apiKey && typeof apiKey === 'string' && apiKey.length > 0) {
    // Validate that it's a real key (not empty placeholder)
    if (apiKey !== 'YOUR_REVENUE_CAT_API_KEY' && apiKey.trim().length > 0) {
      return apiKey.trim();
    }
  }
  
  // No key configured or invalid
  return '';
}

/**
 * Check if RevenueCat API key is configured
 */
export function isRevenueCatKeyConfigured(): boolean {
  const key = getRevenueCatApiKey();
  return key.length > 0 && key !== 'YOUR_REVENUE_CAT_API_KEY';
}

/**
 * Validate Kie.ai API key by making a test API call
 * Uses the correct API base URL: https://api.kie.ai/api/v1
 */
export async function validateKieAIApiKey(): Promise<ApiKeyValidationResult> {
  // Use AIService to get the key (includes SecureStore check)
  const { AIService } = await import('../services/aiService');
  const key = await AIService.getKieAIApiKey();
  
  if (!key || key.length === 0) {
    return {
      configured: false,
      valid: null,
      error: 'API key not configured',
    };
  }

  try {
    // Try to validate by making a request to the jobs endpoint
    // This is a light-weight way to test if the API key is valid
    // We use POST with minimal data to check authentication
    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/nano-banana-edit',
        input: {
          prompt: 'test',
          image_urls: ['https://example.com/test.jpg'],
        },
      }),
    });

    // If we get 401 or 403, the key is invalid
    if (response.status === 401 || response.status === 403) {
      return {
        configured: true,
        valid: false,
        error: 'Invalid API key (authentication failed)',
        testedAt: new Date(),
      };
    }

    // If we get 400 (Bad Request), the key is likely valid but the request data is invalid
    // This is actually good - it means authentication worked
    if (response.status === 400) {
      const responseData = await response.json().catch(() => null);
      // Check if it's a validation error (key is valid) vs authentication error
      const errorText = JSON.stringify(responseData || {}).toLowerCase();
      if (errorText.includes('invalid') || errorText.includes('required') || errorText.includes('validation')) {
        // This means the key is valid, but the test data we sent is invalid
        // That's fine - we just wanted to test authentication
        return {
          configured: true,
          valid: true,
          testedAt: new Date(),
        };
      }
      // Otherwise, it might be an actual error
      return {
        configured: true,
        valid: false,
        error: `API error: ${response.status}`,
        testedAt: new Date(),
      };
    }

    // 200-299 means success (unlikely for our test request, but handle it)
    if (response.status >= 200 && response.status < 300) {
      return {
        configured: true,
        valid: true,
        testedAt: new Date(),
      };
    }

    // Other status codes
    const errorText = await response.text().catch(() => 'Unknown error');
    return {
      configured: true,
      valid: false,
      error: `API error: ${response.status} - ${errorText.substring(0, 200)}`,
      testedAt: new Date(),
    };
  } catch (error: any) {
    // Network errors don't necessarily mean the key is invalid
    // They might mean the endpoint is wrong or network is unavailable
    return {
      configured: true,
      valid: null,
      error: `Could not test key: ${error.message || 'Network error'}. Please check your internet connection.`,
      testedAt: new Date(),
    };
  }
}
